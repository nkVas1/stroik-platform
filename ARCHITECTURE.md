# СТРОИК Platform - Архитектурная документация

## Обзор проекта

**СТРОИК** — это платформа для решения проблем доверия в строительной сфере через:
- ✅ Верификацию подрядчиков и работников
- ✅ Смарт-эскроу для безопасных платежей
- ✅ ИИ-ассистент для быстрого онбординга
- ✅ Привязка отзывов к контрактам

---

## Архитектура

### Высокоуровневая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + React)                │
│  ┌─────────────┬──────────────┬──────────────────────────┐  │
│  │ Hero Page   │ Onboarding   │ Chat with AI Assistant   │  │
│  │ (Landing)   │ (Registration)│ (LLaMA 3 via Ollama)     │  │
│  └─────────────┴──────────────┴──────────────────────────┘  │
│  Design: Brutalism + Skeuomorphism + Pastel Orange Accents  │
│  Deployed on: Vercel (https://vercel.com)                   │
└──────────────────────────────────────────────────────────────┘
                              ↓↑
                          HTTP/REST
                              ↓↑
┌─────────────────────────────────────────────────────────────┐
│               Backend (FastAPI + Python 3.11)                │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Chat Endpoint│ Auth Service │ Business Logic Services │ │
│  │ (/api/chat)  │ (JWT-based)  │ (Verification, Escrow)  │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
│  LLM Integration: Ollama (Local) + Llama 3 (8B model)       │
│  Deployed on: Local VPS / Docker / Cloud                    │
└─────────────────────────────────────────────────────────────┘
                              ↓↑
                          TCP Socket
                              ↓↑
┌─────────────────────────────────────────────────────────────┐
│              Database Tier (PostgreSQL + Prisma ORM)         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Users | Contracts | Reviews | Transactions | Escrow     │ │
│  │ Deployed on: Supabase / Neon / Self-hosted              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓↑
                         (Ollama Service)
                              ↓↑
┌─────────────────────────────────────────────────────────────┐
│           Local AI (Ollama Daemon + Llama 3 8B)             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Running locally on developer's Windows 11 machine       │ │
│  │ Port: 11434                                             │ │
│  │ Model: llama3 (8 billion parameters)                    │ │
│  │ Download: https://ollama.com/download                  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Стек технологий

### Frontend
| Компонент | Технология | Версия | Причина выбора |
|-----------|-----------|--------|---|
| Framework | **Next.js** | 14+ | SSR, ISR, API routes, Vercel native |
| UI Library | **React** | 18+ | Component-based, hooks, ecosystem |
| Styling | **TailwindCSS** | 3+ | Utility-first, DX, customization |
| State | Built-in hooks | - | Не нужен Redux для текущих требований |
| Forms | React + HTML5 | - | Простые формы, можно расширить Zod |
| PWA | **next-pwa** | 5+ | Offline support, installable, app-like |
| Themes | **next-themes** | 0.2+ | Dark/light mode, no flash, localStorage |
| Icons | **lucide-react** | 0.263+ | Lightweight, customizable, tree-shakeable |
| Utilities | **clsx + tailwind-merge** | Latest | Safe class merging, conflict resolution |

### Backend
| Компонент | Технология | Версия | Причина выбора |
|-----------|-----------|--------|---|
| Framework | **FastAPI** | 0.104+ | Async, type hints, auto docs (Swagger) |
| ASGI Server | **Uvicorn** | 0.24+ | Lightweight, async-native, fast |
| Validation | **Pydantic** | 2.0+ | Type hints, validation, JSON schema |
| LLM Integration | **ollama** | 0.1+ | Local models, no API costs, privacy |
| ORM (Future) | **Prisma** | - | Type-safe, migrations, DB agnostic |
| Auth (Future) | **Python-jose + passlib** | - | JWT, bcrypt, industry standard |
| CORS | FastAPI middleware | - | Built-in security |

### Database
| Компонент | Технология | Использование |
|-----------|-----------|---|
| Primary DB | **PostgreSQL** | Транзакции, контракты, отзывы |
| ORM | **Prisma** | Type-safe queries, migrations |
| Deployment | Supabase / Neon | Free tier, managed, backups |

### AI/ML
| Компонент | Технология | Параметры |
|-----------|-----------|---|
| Model | **Llama 3** | 8 billion parameters |
| Serving | **Ollama** | Local daemon, HTTP API |
| Fine-tuning | LoRA (Future) | Domain-specific knowledge |

### DevOps
| Компонент | Технология | Назначение |
|-----------|-----------|---|
| Frontend Hosting | **Vercel** | Next.js optimized, free tier, global CDN |
| Backend Hosting | Docker / VPS | Full control, scalability |
| Database | Supabase / Neon | Managed PostgreSQL |
| Containerization | **Docker** | Consistency, reproducibility |
| Orchestration | **Docker Compose** | Local dev, simple deployments |
| CI/CD (Future) | GitHub Actions | Automated tests, builds, deployments |
| Monitoring (Future) | Datadog / New Relic | Performance, errors, logs |

---

## Структура директорий

```
stroik-platform/
│
├── frontend/                        # Next.js приложение
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout с ThemeProvider
│   │   │   ├── page.tsx            # Hero landing page
│   │   │   ├── globals.css         # Глобальные стили
│   │   │   └── onboarding/         # (Будет) Страница чата-онбординга
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                 # Переиспользуемые UI компоненты
│   │   │   │   ├── Button.tsx      # Кнопка с вариантами
│   │   │   │   ├── Input.tsx       # Текстовое поле
│   │   │   │   └── ThemeToggle.tsx # Переключатель темы
│   │   │   │
│   │   │   └── providers/
│   │   │       └── ThemeProvider.tsx # next-themes обертка
│   │   │
│   │   ├── lib/
│   │   │   └── utils.ts            # Утилиты (cn, типы)
│   │   │
│   │   └── styles/
│   │       └── (иконки, шрифты)
│   │
│   ├── public/
│   │   ├── manifest.json           # PWA манифест
│   │   └── icons/                  # PWA иконки (192x192, 512x512)
│   │
│   ├── package.json                # npm зависимости
│   ├── tsconfig.json               # TypeScript конфиг (strict mode)
│   ├── tailwind.config.ts          # Tailwind tema (colors, shadows)
│   ├── next.config.mjs             # Next.js конфиг + next-pwa
│   ├── postcss.config.js           # PostCSS для Tailwind
│   └── .gitignore                  # Исключение из Git
│
├── backend/                        # FastAPI приложение
│   ├── app/
│   │   ├── main.py                 # Точка входа, инициализация FastAPI
│   │   │
│   │   ├── api/                    # API роутеры
│   │   │   ├── __init__.py
│   │   │   ├── chat.py             # (Будет) Роуты для чата
│   │   │   ├── auth.py             # (Будет) Роуты для аутентификации
│   │   │   └── users.py            # (Будет) Управление профилями
│   │   │
│   │   ├── models/                 # Pydantic и SQLAlchemy модели
│   │   │   ├── __init__.py
│   │   │   ├── chat.py             # Message, ChatRequest, ChatResponse
│   │   │   ├── user.py             # (Будет) User модель
│   │   │   └── contract.py         # (Будет) Contract модель
│   │   │
│   │   ├── services/               # Бизнес-логика
│   │   │   ├── __init__.py
│   │   │   ├── llm_service.py      # Интеграция с Ollama
│   │   │   ├── auth_service.py     # (Будет) JWT, bcrypt
│   │   │   └── verification_service.py # (Будет) Верификация
│   │   │
│   │   └── core/                   # Конфигурация и утилиты
│   │       ├── __init__.py
│   │       ├── config.py           # (Будет) Settings, env vars
│   │       └── security.py         # (Будет) JWT, CORS
│   │
│   ├── tests/                      # (Будет) Unit и integration тесты
│   │   ├── test_chat.py
│   │   └── test_llm_service.py
│   │
│   ├── pyproject.toml              # Python зависимости (PEP 517)
│   ├── .env.example                # Пример переменных окружения
│   ├── .gitignore                  # Исключение из Git
│   ├── README.md                   # Backend документация
│   └── requirements.txt            # (Опционально) Классический формат
│
├── infrastructure/                 # DevOps конфигурации
│   ├── docker-compose.yml          # Локальная разработка (БД + сервисы)
│   ├── Dockerfile                  # (Будет) Для backend контейнера
│   ├── Dockerfile.frontend         # (Будет) Для frontend контейнера
│   └── nginx/                      # (Будет) Nginx конфиг для production
│
├── docs/                           # (Опционально) Документация проекта
│   ├── API.md                      # API endpoints документация
│   ├── DATABASE.md                 # Схема БД
│   └── DEPLOYMENT.md               # Инструкции по развертыванию
│
├── .gitignore                      # Корневой .gitignore
├── .github/                        # (Будет) GitHub Actions
│   └── workflows/
│       ├── ci.yml                  # Линтинг, тесты
│       └── deploy.yml              # Автодеплой
│
├── README.md                       # Главная документация проекта
├── GITHUB_SETUP.md                 # Инструкции по загрузке на GitHub
├── ARCHITECTURE.md                 # Эта файл
│
└── start-dev.ps1                   # PowerShell скрипт для быстрого старта
```

---

## Фазы развития

### Phase 0: ✅ Исследование и прототип (текущая)
- [x] Выбор стека технологий
- [x] Создание базовой структуры frontend
- [x] Создание структуры backend
- [x] Дизайн-система (Brute + Skeuomorphism)
- [x] Инициализация Git

### Phase 1: Ядро (Core) — Onboarding
- [ ] Страница `/onboarding` на frontend
- [ ] ChatWindow компонент
- [ ] Интеграция frontend → backend API
- [ ] Тестирование LLM через Ollama
- [ ] Валидация данных пользователя

### Phase 2: Верификация
- [ ] Система проверки подрядчиков
- [ ] Портфолио и отзывы
- [ ] Модерация контента
- [ ] Система рейтингов

### Phase 3: Контракты и платежи
- [ ] Smart Escrow логика
- [ ] Система оплаты
- [ ] Управление контрактами
- [ ] История транзакций

### Phase 4: Масштабирование
- [ ] Инвестирование в облачную инфраструктуру
- [ ] AI fine-tuning
- [ ] Мобильное приложение (React Native)
- [ ] Маркетинг и запуск

---

## Паттерны проектирования

### Frontend
- **Atomic Design**: Atoms (Button) → Molecules → Organisms → Pages
- **Composition**: Переиспользуемые компоненты с правильной инкапсуляцией
- **Separation of Concerns**: UI отделена от логики через Hooks и Providers
- **Type Safety**: 100% TypeScript strict mode

### Backend
- **Service Layer**: Бизнес-логика в сервисах (`LLMService`)
- **Dependency Injection**: FastAPI, а не глобальные переменные
- **Repository Pattern**: (Будет в Phase 2) Абстракция БД операций
- **Async/Await**: Асинхронные операции для I/O
- **Pydantic Models**: Валидация на входе и выходе

---

## Соглашения кодирования

### Frontend (TypeScript)
```typescript
// ✅ Хорошо
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => (
  <button className={cn(baseStyles, variants[variant])} {...props}>
    {children}
  </button>
);

// ❌ Плохо
export const button = (props) => {
  const style = props.variant === 'primary' ? 'btn btn-primary' : 'btn';
  return <button className={style}>{props.children}</button>;
};
```

### Backend (Python)
```python
# ✅ Хорошо
async def generate_response(self, messages: List[Message]) -> str:
    """Генерирует ответ модели."""
    formatted_messages = [self.system_prompt]
    for msg in messages:
        formatted_messages.append({"role": msg.role, "content": msg.content})
    return await self._call_ollama(formatted_messages)

# ❌ Плохо
def generate_response(self, messages):
    return ollama.chat(model=self.model, messages=messages)['message']['content']
```

---

## Security Considerations

### Frontend
- ✅ CSP headers (будет в next.config)
- ✅ XSS protection через React escaping
- ✅ HTTPS только в production
- ✅ Secure cookies для tokens

### Backend
- ✅ CORS ограничения (только localhost:3000 в dev)
- ✅ Rate limiting (будет в Phase 1)
- ✅ Input validation через Pydantic
- ✅ SQL injection protection (Prisma ORM)
- ✅ JWT tokens с expiration (будет в Phase 2)

### Database
- ✅ Password hashing (bcrypt, будет в Phase 2)
- ✅ Encrypted PII (будет в Phase 2)
- ✅ Regular backups (Supabase managed)
- ✅ SSL/TLS connections

---

## Performance Targets

| Метрика | Цель | Инструменты |
|---------|-----|---|
| Frontend FCP | < 1.5s | Lighthouse, Web Vitals |
| Backend Latency | < 200ms | FastAPI metrics, Datadog |
| LLM Response | < 5s | Ollama optimization |
| Database Query | < 100ms | PostgreSQL EXPLAIN ANALYZE |
| Lighthouse Score | > 90 | Automated in CI/CD |

---

## Развертывание (Deployment)

### Development
```bash
# Локально на Windows 11
.\start-dev.ps1
```

### Staging / Production
```bash
# Frontend → Vercel (automatic from main branch)
# Backend → Docker Hub / AWS ECR → ECS / EKS
# Database → Supabase / AWS RDS
```

---

## Лицензия

MIT (будет определена в package.json)

---

**Last Updated**: 2024-04-26  
**Maintained by**: Stroik Development Team
