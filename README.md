# 🏗️ СТРОИК Platform v4.2

**Умная платформа для найма строителей с локальной LLM и системой верификации**

[![Фаза](https://img.shields.io/badge/Фаза-4.2%20Native%20JSON%20Mode-brightgreen)]()
[![Стек](https://img.shields.io/badge/Стек-FastAPI%20%2B%20Next.js%20%2B%20Ollama-blue)]()
[![Статус](https://img.shields.io/badge/Статус-Production%20Ready-success)]()

---

## 🎯 Что такое СТРОИК?

СТРОИК — платформа для поиска специалистов и проектов в строительной сфере. Ключевые особенности:

- ✅ **AI-чат с умным ассистентом** (Llama3 8B через Ollama)
- ✅ **Native JSON Mode** (Ollama `format='json'` блокирует галлюцинации)
- ✅ **Система верификации** (4 уровня: 0-3)
- ✅ **JWT аутентификация** с Bearer токенами
- ✅ **Этичные легальные фильтры** (языковое владение + право на работу)
- ✅ **Гибридный режим**: создание новых пользователей + обновление профилей
- ✅ **Dark/Light тема** с Brutal + Skeuomorphic дизайном

---

## 🚀 Быстрый старт

### Требования
- Python 3.11+
- Node.js 18+
- Ollama ([скачать здесь](https://ollama.com))

### 1. Клонируй и подготовь
```bash
git clone <repo>
cd stroik-platform

# Активируй виртуальное окружение (если есть)
source .venv/bin/activate  # Linux/Mac
.\.venv\Scripts\Activate.ps1  # Windows
```

### 2. Backend
```bash
cd backend
pip install -e .  # Из pyproject.toml
alembic upgrade head  # Миграция БД
python3 run.py  # Запуск на http://127.0.0.1:8000
```

### 3. Ollama (отдельный терминал)
```bash
ollama serve
# В другом терминале:
ollama pull llama3  # Загрузи модель (~4.7 GB)
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev  # Запуск на http://localhost:3000
```

### 5. Проверка
```bash
curl http://127.0.0.1:8000/health
# Ответ: {"status": "ok", "service": "Stroik Core API"}
```

---

## 📚 Документация

| Документ | Назначение |
|----------|-----------|
| **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** | Полная техническая архитектура, модели данных, API |
| **[PHASE4.1_REFACTOR.md](PHASE4.1_REFACTOR.md)** | Изменения 4.0 → 4.1, State Machine паттерн, исправления |
| **[QUICK_START.md](QUICK_START.md)** | Гайд для разработчиков |
| **[PHASE3_COMPLETE.md](PHASE3_COMPLETE.md)** | Детали JWT аутентификации |

---

## 🔑 Технологии

**Frontend:**
- Next.js 14 (SSR)
- React 18 (Hooks)
- TypeScript (strict mode)
- Tailwind CSS (Brutal дизайн)
- next-themes (Dark/Light)

**Backend:**
- FastAPI 0.104+
- SQLAlchemy 2.0 (Async ORM)
- SQLite 3 + Aiosqlite
- Alembic (Миграции)
- python-jose (JWT)

**AI/ML:**
- Ollama (Local LLM runner)
- Llama3 8B (Основная модель)
- State Machine паттерн (генерация промптов)

---

## 📖 Как это работает?

### 1. Поток онбординга
```
Пользователь заходит на /onboarding
    ↓
ChatWindow загружается (нет токена)
    ↓
LLM получает STATE 0 промпт (просит выбрать роль)
    ↓
Пользователь отвечает → Backend создает User + Profile
    ↓
JWT токен сгенерирован → отправлен во Frontend
    ↓
localStorage.stroik_token сохранен
    ↓
Редирект на /dashboard
```

### 2. Поток верификации (Существующие пользователи)
```
Пользователь заходит на /onboarding с токеном
    ↓
AuthGuard распознает токен
    ↓
Backend извлекает User из JWT
    ↓
LLM получает STATE 1 промпт (просит ФИО + город)
    ↓
Пользователь отвечает → Backend обновляет Profile
    ↓
verification_level incrementирован (0 → 1)
    ↓
Продолжение в чате (STATE 2 для редактирования профиля)
```

### 3. Коммуникация с API
```
POST /api/chat
├─ Без токена: онбординг нового пользователя
├─ С токеном + verification_level < 1: верификация
└─ С токеном + verification_level >= 1: обновление профиля

GET /api/users/me
└─ Возвращает полный профиль (требуется токен)
```

---

## 🗄️ Схема базы данных

### Пользователи и профили
```sql
users
  ├─ id (PK)
  ├─ is_verified (bool)
  └─ profile (1:1 отношение)

profiles
  ├─ id, user_id (FK)
  ├─ role: WORKER | EMPLOYER | UNKNOWN
  ├─ entity_type: PHYSICAL | LEGAL | UNKNOWN
  ├─ verification_level: NONE(0) | BASIC(1) | CONTACTS(2) | PASSPORT(3)
  ├─ fio: string (Полное имя)
  ├─ location: string (Город)
  ├─ language_proficiency: string (вместо национальности!)
  ├─ work_authorization: string (вместо национальности!)
  └─ ...20+ доп. полей для специальности, опыта и т.д.
```

---

## 🔐 Аутентификация

**JWT Токены:**
- Сгенерированы при успешном онбординге
- TTL: 7 дней
- Хранятся в `localStorage.stroik_token`
- Отправляются через `Authorization: Bearer <token>` header
- Валидируются функцией `get_current_user()`

**Защищенные маршруты:**
- `/dashboard` - требуется валидный токен (AuthGuard)
- `GET /api/users/me` - требуется валидный токен
- `POST /api/chat` - опциональный токен (гибридный режим)

---

## 🤖 LLM архитектура (State Machine)

Вместо одного гигантского промпта → **3 специализированных промпта**:

```
┌─ STATE 0: Онбординг (новый пользователь)
│  └─ Промпт: "Спроси про роль (worker/employer) и тип лица"
│
├─ STATE 1: Верификация (verification_level < 1)
│  └─ Промпт: "Спроси про ФИО и город"
│
└─ STATE 2: Помощник профиля (verification_level >= 1)
   └─ Промпт: "Помогай с навыками, переводи легальные фильтры"
```

Это предотвращает **перегруз контекста** → LLM остается сфокусирована и стабильна.

---

## 🐛 Исправления в Phase 4.1

| Проблема | Причина | Решение |
|----------|---------|---------|
| LLM сходит с ума | Перегруз промпта | State Machine паттерн |
| Страница перезагружается | Button type="submit" | Изменено на type="button" + preventDefault() |
| Кнопка видна гостям | Нет проверки auth | Добавлена проверка isAuthenticated |
| JSON в чате | Неоднозначный парсинг | Используется маркер "JSON_DATA:" |

---

## 📊 Структура проекта

```
stroik-platform/
├── frontend/                    # Next.js приложение
│   ├── src/
│   │   ├── app/               # Страницы и layouts
│   │   ├── components/        # React компоненты
│   │   ├── lib/               # Утилиты
│   │   └── styles/            # Глобальные стили
│   └── package.json
│
├── backend/                     # FastAPI приложение
│   ├── app/
│   │   ├── main.py            # Точка входа
│   │   ├── models/            # SQLAlchemy ORM
│   │   ├── services/          # LLM сервис
│   │   └── core/              # БД, auth, security
│   ├── alembic/               # Миграции БД
│   ├── pyproject.toml         # Зависимости
│   └── stroik.db              # SQLite база данных
│
├── infrastructure/             # Docker конфиги (будущее)
├── DOCS/
│   └── PROJECT_ARCHITECTURE.md  # Полная техническая документация
└── README.md (этот файл)
```

---

## 🔄 Примеры API

### 1. Онбординг нового пользователя
```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Я сварщик с 10 годами опыта"}
    ]
  }'

# Ответ:
{
  "response": "Отлично! Вы ищете работу или хотите нанять специалистов?",
  "is_complete": false,
  "access_token": null
}
```

### 2. Получить профиль пользователя
```bash
curl http://127.0.0.1:8000/api/users/me \
  -H "Authorization: Bearer eyJhbGc..."

# Ответ:
{
  "id": 12,
  "role": "worker",
  "entity_type": "physical",
  "verification_level": 1,
  "fio": "Иванов Иван Иванович",
  "location": "Москва",
  "language_proficiency": "Свободное владение русским",
  "work_authorization": "Гражданство РФ"
}
```

---

## 🧪 Тестирование

### Ручное тестирование
1. Откройте http://localhost:3000/onboarding
2. Чатьте с AI (режим нового пользователя)
3. Завершите онбординг → получите токен
4. Посетите /dashboard → видьте свой профиль
5. Вернитесь на /onboarding → активирован режим верификации

### Тестирование API
```bash
# Health check
curl http://127.0.0.1:8000/health

# Chat endpoint
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Привет"}]}'
```

---

## 🚧 Известные ограничения

- ⚠️ Ollama требует 8GB+ RAM (для Llama3 8B)
- ⚠️ SQLite только для разработки (в production → PostgreSQL)
- ⚠️ Rate limiting еще не реализовано
- ⚠️ Загрузка документов для уровня 3 верификации (Phase 4b)

---

## 🔜 Дорожная карта

- [ ] **Phase 4b**: Загрузка документов (верификация паспорта)
- [ ] **Phase 5**: Matching engine (поиск рабочих/проектов)
- [ ] **Phase 6**: Интеграция платежей (Stripe, Яндекс.Касса)
- [ ] **Phase 7**: Система контрактов и эскроу
- [ ] **Phase 8**: Мобильное приложение (React Native)

---

## 📞 Поддержка

- 📖 Читай [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) для углубленного изучения
- 🐛 Нашел баг? Создай issue
- 💡 Идеи приветствуются!

---

## 📄 Лицензия

MIT License - свободен для использования и модификации

---

**Последнее обновление:** 27.04.2026  
**Текущая фаза:** 4.1 - State Machine архитектура  
**Статус:** ✅ Production Ready

## Быстрый старт

1. Установи зависимости:
```bash
cd frontend
npm install
cd ../backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

2. Запусти Ollama и загрузи модель:
```bash
ollama run llama3
```

3. Запусти сервера:
```bash
# Frontend
cd frontend
npm run dev

# Backend (в отдельном терминале)
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

4. Открой [http://localhost:3000](http://localhost:3000)

## Контакты

Для вопросов или предложений обратись в документацию проекта.
