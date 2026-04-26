# СТРОИК Platform - GitHub Setup Guide

## Загрузка на GitHub

Проект готов к загрузке на GitHub. Следуй этим шагам:

### 1. Создай репозиторий на GitHub

- Перейди на [github.com/new](https://github.com/new)
- Название репозитория: `stroik-platform`
- Описание: "Construction platform with AI onboarding assistant | Платформа для строительства с ИИ-ассистентом"
- Выбери: **Private** (приватный)
- **Не** инициализируй README, .gitignore или license (у нас уже есть)

### 2. Подключи удаленный репозиторий

После создания репозитория на GitHub, выполни в терминале (в корне проекта):

```bash
# Добавь удаленный репозиторий
git remote add origin https://github.com/ТОЙ_GITHUB_USERNAME/stroik-platform.git

# Переименуй ветку (если нужно)
git branch -M main

# Выложи все коммиты на GitHub
git push -u origin main
```

Замени `ТОЙ_GITHUB_USERNAME` на твой реальный GitHub username.

### 3. Если у тебя уже есть SSH ключи

Если предпочитаешь использовать SSH вместо HTTPS:

```bash
git remote add origin git@github.com:ТОЙ_GITHUB_USERNAME/stroik-platform.git
git branch -M main
git push -u origin main
```

### 4. Проверь, что всё загрузилось

- Открой твой репозиторий на GitHub
- Убедись, что все папки и файлы видны
- Проверь, что коммит с сообщением "🚀 Initial commit: СТРОИК Platform" присутствует

---

## Структура проекта, что уже готово

✅ **Frontend** (`/frontend`)
- Next.js 14 с TypeScript
- TailwindCSS + дизайн-система (брутализм + скевоморфизм)
- PWA готовности для мобильных
- UI компоненты: Button, Input, ThemeToggle
- Светлая/темная тема с `next-themes`
- Главная страница (Hero)

✅ **Backend** (`/backend`)
- FastAPI с Python 3.11+
- Интеграция с Ollama для локальной LLM
- Pydantic модели для валидации данных
- CORS настройка для безопасности
- Health check эндпоинт
- Chat endpoint для ИИ-ассистента

✅ **Infrastructure** (`/infrastructure`)
- Docker Compose конфигурация для PostgreSQL
- Готовая БД для развертывания

✅ **DevOps**
- PowerShell скрипт для автоматизации (`start-dev.ps1`)
- .gitignore файлы для обеих частей проекта
- Правильная конфигурация инструментов

---

## Следующие шаги разработки

После загрузки на GitHub можешь начать Phase 1:

1. **Создать страницу /onboarding** - интерфейс чата
2. **Реализовать ChatWindow компонент** - контейнер для сообщений
3. **Подключить фронтенд к backend** - интеграция API запросов
4. **Тестирование** - проверить взаимодействие ИИ с пользователем

---

## Контакты и поддержка

Для вопросов - обратись к документации в README.md
