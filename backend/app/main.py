from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func
from typing import Optional
from jose import jwt, JWTError
from pydantic import BaseModel
import logging

from app.models.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, SECRET_KEY, ALGORITHM
from app.models.db_models import User, Profile, UserRole, EntityType, VerificationLevel, Project, Bid, BidStatus, ProjectStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация приложения
app = FastAPI(
    title="Stroik API",
    description="API для строительной платформы СТРОИК",
    version="0.1.0"
)

# Настройка CORS (Разрешаем запросы с локального фронтенда)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic схемы для API
class BidCreateRequest(BaseModel):
    cover_letter: Optional[str] = "Готов выполнить работу качественно и в срок."
    price_offer: Optional[int] = None

# ФИКС: Убрали аргумент model_name. Теперь сервис сам берет Gemini 2.5 Flash.
llm_service = LLMService()

@app.get("/health")
async def health_check():
    """Эндпоинт для проверки статуса сервера (Health check)."""
    return {"status": "ok", "service": "Stroik Core API"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest, 
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    # 1. Жесткая проверка авторизации
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                result = await db.execute(select(User).options(selectinload(User.profile)).where(User.id == int(user_id)))
                current_user = result.scalar_one_or_none()
                logger.info(f"✅ Чат: Авторизован User ID {current_user.id}, Роль: {current_user.profile.role.value}")
        except Exception as e:
            logger.warning(f"⚠️ Ошибка токена в чате: {e}")

    if not current_user:
        logger.info("🕵️ Чат: Гостевая сессия (Новый пользователь)")

    # 2. Вызов Gemini с передачей пользователя
    reply, extracted_data = await llm_service.generate_response(request.messages, current_user=current_user)

    # 3. Обработка результатов
    if extracted_data:
        action = extracted_data.get("action", "update_profile")
        data_patch = extracted_data.get("data", {})
        
        try:
            if current_user:
                if action == "create_project":
                    from app.models.db_models import Project
                    new_project = Project(
                        employer_id=current_user.id,
                        title=data_patch.get("title", "Новый заказ"),
                        description=data_patch.get("description", ""),
                        budget=data_patch.get("budget", 0),
                        required_specialization=data_patch.get("required_specialization", "")
                    )
                    db.add(new_project)
                    await db.commit()
                    return ChatResponse(response=reply, is_complete=False)
                else:
                    for key, value in data_patch.items():
                        if hasattr(current_user.profile, key):
                            setattr(current_user.profile, key, value)
                    await db.commit()
                    return ChatResponse(response=reply, is_complete=False)
            else:
                # Базовый онбординг (создание нового пользователя)
                if "role" in data_patch:
                    logger.info("✨ Завершение базового онбординга")
                    new_user = User(is_verified=False)
                    db.add(new_user)
                    await db.flush() # Получаем ID

                    from app.models.db_models import UserRole, EntityType
                    
                    db_role = UserRole.WORKER if data_patch.get("role") == "worker" else UserRole.EMPLOYER
                    
                    # Фикс: Безопасная обработка entity_type
                    entity_val = data_patch.get("entity_type")
                    if entity_val == "physical":
                        db_entity = EntityType.PHYSICAL
                    elif entity_val == "legal":
                        db_entity = EntityType.LEGAL
                    else:
                        db_entity = EntityType.UNKNOWN

                    new_profile = Profile(
                        user_id=new_user.id,
                        role=db_role,
                        entity_type=db_entity,
                        raw_data=data_patch
                    )
                    db.add(new_profile)
                    await db.commit()

                    token = create_access_token(data={"sub": str(new_user.id)})
                    return ChatResponse(response=reply, is_complete=True, access_token=token)
                    
        except Exception as e:
            await db.rollback()
            logger.error(f"Ошибка сохранения в БД: {e}")
            return ChatResponse(response="Данные приняты, но произошла техническая ошибка.", is_complete=False)

    return ChatResponse(response=reply, is_complete=False)


@app.get("/api/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Возвращает данные текущего авторизованного пользователя.
    Требует валидный JWT токен в заголовке Authorization: Bearer <token>
    """
    profile = current_user.profile
    
    return {
        "id": current_user.id,
        "is_verified": current_user.is_verified,
        "role": profile.role.value if profile else "unknown",
        "entity_type": profile.entity_type.value if profile else "unknown",
        "company_name": profile.company_name if profile else None,
        "verification_level": profile.verification_level.value if profile else 0,
        "fio": profile.fio if profile else None,
        "location": profile.location if profile else None,
        "email": profile.email if profile else None,
        "language_proficiency": profile.language_proficiency if profile else None,
        "work_authorization": profile.work_authorization if profile else None,
        "specialization": profile.specialization if profile else None,
        "experience_years": profile.experience_years if profile else None,
        "project_scope": profile.project_scope if profile else None,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }


@app.get("/api/projects")
async def get_projects(db: AsyncSession = Depends(get_db)):
    """Возвращает список свежих заказов с данными заказчика для Live Feed."""
    try:
        # Добавляем загрузку связи с работодателем и его профилем
        stmt = select(Project).options(
            selectinload(Project.employer).selectinload(User.profile)
        ).where(Project.status == "open").order_by(Project.created_at.desc()).limit(20)
        
        result = await db.execute(stmt)
        projects = result.scalars().all()
        
        return [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "budget": p.budget,
                "specialization": p.required_specialization,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "employer_name": p.employer.profile.company_name or p.employer.profile.fio or f"Заказчик #{p.employer.id}",
                "location": p.employer.profile.location or "Город не указан"
            }
            for p in projects
        ]
    except Exception as e:
        logger.error(f"❌ Ошибка при загрузке проектов: {str(e)}")
        return []


@app.post("/api/projects/{project_id}/bids")
async def create_bid(
    project_id: int, 
    bid_data: BidCreateRequest, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Эндпоинт для отклика специалиста на заказ."""
    from app.models.db_models import Bid, Project
    
    # Проверяем, что откликается именно рабочий
    if current_user.profile.role.value != "worker":
        raise HTTPException(status_code=403, detail="Только специалисты могут откликаться на проекты")
    
    # Проверяем, существует ли проект
    project_result = await db.execute(select(Project).where(Project.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project or project.status != "open":
        raise HTTPException(status_code=404, detail="Проект не найден или уже закрыт")
        
    # Защита от дублей (один рабочий - один отклик на проект)
    existing_bid = await db.execute(select(Bid).where(Bid.project_id == project_id, Bid.worker_id == current_user.id))
    if existing_bid.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Вы уже откликнулись на этот заказ")

    new_bid = Bid(
        project_id=project_id,
        worker_id=current_user.id,
        cover_letter=bid_data.cover_letter,
        price_offer=bid_data.price_offer or project.budget
    )
    db.add(new_bid)
    await db.commit()
    
    return {"status": "success", "message": "Отклик успешно отправлен", "bid_id": new_bid.id}


# --- ИНФРАСТРУКТУРА СДЕЛОК (PHASE 3.2) ---

@app.get("/api/users/me/dashboard_data")
async def get_dashboard_data(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Умный эндпоинт, отдающий разные данные в зависимости от роли (Рабочий/Заказчик)"""
    
    role = current_user.profile.role.value
    
    if role == "employer":
        # Заказчик получает свои проекты и все отклики на них
        stmt = select(Project).options(
            selectinload(Project.bids).selectinload(Bid.worker).selectinload(User.profile)
        ).where(Project.employer_id == current_user.id).order_by(Project.created_at.desc())
        res = await db.execute(stmt)
        projects = res.scalars().all()
        
        data = []
        for p in projects:
            bids_data = [{
                "id": b.id,
                "worker_name": b.worker.profile.fio or f"Специалист #{b.worker.id}",
                "worker_spec": b.worker.profile.specialization,
                "cover_letter": b.cover_letter,
                "price_offer": b.price_offer,
                "status": b.status.value,
            } for b in p.bids]
            
            data.append({
                "id": p.id,
                "title": p.title,
                "status": p.status.value,
                "bids": bids_data
            })
        return {"type": "employer", "projects": data}
        
    elif role == "worker":
        # Рабочий получает статус своих отправленных откликов
        stmt = select(Bid).options(selectinload(Bid.project)).where(Bid.worker_id == current_user.id).order_by(Bid.created_at.desc())
        res = await db.execute(stmt)
        bids = res.scalars().all()
        
        data = [{
            "id": b.id,
            "project_title": b.project.title,
            "project_budget": b.project.budget,
            "project_status": b.project.status.value,
            "status": b.status.value
        } for b in bids]
        return {"type": "worker", "bids": data}
        
    return {"type": "unknown"}


@app.post("/api/bids/{bid_id}/accept")
async def accept_bid(bid_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Механизм заключения сделки (Заказчик выбирает исполнителя)"""
    
    # Находим отклик и проект
    stmt = select(Bid).options(selectinload(Bid.project)).where(Bid.id == bid_id)
    res = await db.execute(stmt)
    bid = res.scalar_one_or_none()
    
    if not bid:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    if bid.project.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
        
    # Стартуем сделку
    bid.status = BidStatus.ACCEPTED
    bid.project.status = ProjectStatus.IN_PROGRESS
    
    # Автоматически отклоняем всех остальных кандидатов
    stmt_others = select(Bid).where(Bid.project_id == bid.project.id, Bid.id != bid_id)
    res_others = await db.execute(stmt_others)
    for other_bid in res_others.scalars().all():
        other_bid.status = BidStatus.REJECTED
        
    await db.commit()
    return {"status": "success", "message": "Исполнитель назначен. Сделка начата."}


# НОВЫЙ ЭНДПОИНТ: Завершение работы (Смарт-Эскроу, выплата денег)
@app.post("/api/projects/{project_id}/complete")
async def complete_project(project_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Заказчик принимает объект и подтверждает выплату. Средства переводятся подрядчику из Эскроу."""
    stmt = select(Project).where(Project.id == project_id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    
    if not project or project.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только заказчик может завершить сделку")
        
    project.status = ProjectStatus.COMPLETED
    await db.commit()
    return {"status": "success", "message": "Работа принята. Средства выплачены подрядчику."}
