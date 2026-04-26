# СТРОИК Platform - Инструкция по запуску и развертыванию

## ✅ Что уже готово

Проект **ПОЛНОСТЬЮ ИНИЦИАЛИЗИРОВАН** и готов к использованию. Структура соответствует лучшим практикам production-ready приложений.

### Структура проекта (35 файлов)

```
✅ Frontend (Next.js 14)
   ├─ UI Components (Button, Input, ThemeToggle)
   ├─ Design System (Tailwind + Brute + Skeuomorphism)
   ├─ PWA Configuration (next-pwa)
   ├─ Theme Provider (next-themes)
   └─ Landing Page (Hero section)

✅ Backend (FastAPI + Python)
   ├─ Main Application (app/main.py)
   ├─ Chat Models & Services
   ├─ LLM Service (Ollama integration)
   ├─ Error Handling & CORS
   └─ Pydantic Validation

✅ Infrastructure
   ├─ Docker Compose (PostgreSQL)
   ├─ Environment Configuration
   └─ DevOps Scripts

✅ Git Repository
   ├─ Initial Commit (32 files)
   ├─ GitHub Setup Guide
   └─ Architecture Documentation
```

---

## 🚀 Быстрый старт

### Требования
- **Windows 11** (или Mac/Linux)
- **Node.js 18+** — [Скачать](https://nodejs.org/en/download)
- **Python 3.11+** — [Скачать](https://www.python.org/downloads)
- **Ollama** — [Скачать](https://ollama.com/download)
- **Git** — [Скачать](https://git-scm.com)

### Шаг 1: Запусти Ollama локально

```bash
# Установи Ollama с официального сайта
# После установки откройка PowerShell/CMD и выполни:

ollama run llama3

# Это скачает модель (8GB) и запустит её локально на порту 11434
# Оставь этот терминал работающим
```

### Шаг 2: Клонируй/откройи проект

```bash
# Если ты в PowerShell в папке проекта:
cd "g:\CODING\СТРОИК\stroik-platform"

# Или открой через VS Code:
# File → Open Folder → выбери папку stroik-platform
```

### Шаг 3: Запусти скрипт автоматизации

```powershell
# В PowerShell (в корне проекта):
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\start-dev.ps1

# Скрипт автоматически:
# 1. Установит npm зависимости (frontend)
# 2. Создаст Python venv (backend)
# 3. Запустит оба сервера в отдельных окнах
```

### Шаг 4: Открой приложение

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs (Swagger UI)
- **Health Check**: http://localhost:8000/health

---

## 📦 Ручная установка (если скрипт не сработал)

### Frontend

```bash
cd frontend

# Установи зависимости
npm install

# Запусти dev сервер
npm run dev
# Открется http://localhost:3000
```

### Backend

```bash
cd backend

# Создай virtual environment
python -m venv venv

# Активируй venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Mac/Linux

# Установи зависимости
pip install -e .
# или
pip install -r requirements.txt

# Запусти сервер
uvicorn app.main:app --reload --port 8000
# Backend запустится на http://localhost:8000
```

---

## 🔗 API Endpoints (Текущие)

```
GET  /health
     Проверка статуса сервера
     Response: { "status": "ok", "service": "Stroik Core API" }

POST /api/chat
     Отправить сообщение ИИ-ассистенту
     Body: { "user_id": "user123", "messages": [...] }
     Response: { "response": "Привет! Расскажи о себе..." }
```

### Пример запроса (cURL)

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "messages": [
      {"role": "user", "content": "Привет, я ищу работу в строительстве"}
    ]
  }'
```

### Пример с Python

```python
import requests

response = requests.post(
    "http://localhost:8000/api/chat",
    json={
        "user_id": "test_user",
        "messages": [
            {"role": "user", "content": "Кто ты?"}
        ]
    }
)
print(response.json())
# { "response": "Я — ИИ-ассистент платформы СТРОИК..." }
```

---

## 📝 Комманды разработки

### Frontend

```bash
cd frontend

npm run dev          # Запуск dev сервера (http://localhost:3000)
npm run build        # Сборка для production
npm start            # Запуск production сервера
npm run lint         # Проверка кода (ESLint)
npm run type-check   # TypeScript проверка
```

### Backend

```bash
cd backend

uvicorn app.main:app --reload --port 8000   # Dev сервер
uvicorn app.main:app --port 8000            # Production

# Если используешь другой инструмент:
python -m pip install pytest                # Установка тестов
pytest tests/                               # Запуск тестов
```

---

## 🛠 Загрузка на GitHub

### 1. Создай репозиторий на GitHub

Перейди на https://github.com/new и создай репозиторий:
- **Name**: `stroik-platform`
- **Description**: "Construction platform with AI onboarding"
- **Visibility**: Private
- **Do NOT initialize with README, .gitignore, or license** (у нас уже есть)

### 2. Подключи удаленный репозиторий

```bash
cd g:\CODING\СТРОИК\stroik-platform

# Добавь remote (замени USERNAME на свой GitHub username)
git remote add origin https://github.com/USERNAME/stroik-platform.git

# Переименуй ветку в main (если нужно)
git branch -M main

# Выложи на GitHub
git push -u origin main
```

### 3. Проверь на GitHub

Открой https://github.com/USERNAME/stroik-platform и убедись что:
- ✅ Все файлы загружены
- ✅ 3 коммита видны в истории
- ✅ README отображается

---

## 📊 Структура Git коммитов

```
98700e9 - docs: Add comprehensive architecture documentation
b225aaf - docs: Add GitHub setup guide and root .gitignore
8eb032d - 🚀 Initial commit: СТРОИК Platform - Phase 0 Foundation
```

**Проект готов к следующей фазе!**

---

## 🔍 Проверка установки

### Проверь что всё работает

```bash
# 1. Проверь Node.js
node --version
# v18.x.x или выше ✅

# 2. Проверь Python
python --version
# Python 3.11.x или выше ✅

# 3. Проверь Ollama
curl http://localhost:11434/api/tags
# { "models": [{ "name": "llama3:latest", ... }] } ✅

# 4. Проверь Git
git log --oneline
# 3 коммита должны быть видны ✅
```

---

## 🚨 Частые проблемы и решения

### Problem: "Node command not found"
**Solution**: Переустанови Node.js, убедись что добавлен в PATH

### Problem: "Python venv не активируется"
**Solution**: Используй полный путь
```bash
C:\path\to\stroik-platform\backend\venv\Scripts\activate
```

### Problem: "Ollama connection refused (port 11434)"
**Solution**: 
1. Убедись что Ollama запущена: `ollama serve`
2. Проверь что модель загружена: `ollama run llama3`
3. Перезагрузи Ollama если нужно

### Problem: "CORS error в браузере"
**Solution**: CORS уже настроен для localhost:3000 в backend/app/main.py

### Problem: "Git command not found"
**Solution**: Установи Git с https://git-scm.com

---

## 📚 Документация

| Файл | Описание |
|------|---------|
| [README.md](README.md) | Главная документация проекта |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Архитектура, стек, паттерны |
| [GITHUB_SETUP.md](GITHUB_SETUP.md) | Инструкции по загрузке на GitHub |
| [QUICK_START.md](QUICK_START.md) | Этот файл |
| [backend/README.md](backend/README.md) | Backend документация |

---

## 🎯 Следующие шаги

После успешного запуска, следующие этапы:

1. **Phase 1: Onboarding Chat Interface**
   - [ ] Создать страницу `/onboarding`
   - [ ] Реализовать ChatWindow компонент
   - [ ] Подключить frontend → backend API

2. **Phase 2: User Verification**
   - [ ] User registration flow
   - [ ] Portfolio & reviews system
   - [ ] Rating system

3. **Phase 3: Smart Escrow**
   - [ ] Contract management
   - [ ] Payment processing
   - [ ] Transaction history

4. **Phase 4: Scaling**
   - [ ] Cloud deployment
   - [ ] Mobile app (React Native)
   - [ ] Marketing launch

---

## 🤝 Contributing

1. Создай нову branch: `git checkout -b feature/feature-name`
2. Коммитай свои изменения: `git commit -m "feat: description"`
3. Пуш в remote: `git push origin feature/feature-name`
4. Открой Pull Request

---

## 📞 Помощь

Если у тебя есть вопросы:
1. Проверь [ARCHITECTURE.md](ARCHITECTURE.md)
2. Посмотри на примеры в коде
3. Обратись к документации стека (Next.js, FastAPI, TailwindCSS)

---

**Enjoy building СТРОИК! 🚀**

Last Updated: 2024-04-26
