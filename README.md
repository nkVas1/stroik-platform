# СТРОИК Platform

Платформа для решения проблем доверия в строительной сфере через верификацию, смарт-эскроу и ИИ-ассистент.

## Структура проекта

```
stroik-platform/
├── frontend/          # Next.js приложение (Vercel)
├── backend/           # Python FastAPI сервер
├── infrastructure/    # Docker-compose и конфигурации
└── start-dev.ps1      # Скрипт автоматического запуска
```

## Архитектура

- **Frontend**: Next.js + React + TailwindCSS + PWA
- **Backend**: FastAPI + Pydantic + Ollama (локальная LLM)
- **Database**: PostgreSQL (в Docker)
- **AI Model**: Llama 3 (локально через Ollama)

## Требования

- Node.js 18+
- Python 3.11+
- Ollama (для локальной LLM)
- Docker & Docker Compose (опционально для БД)

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
