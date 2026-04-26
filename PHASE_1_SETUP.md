# Phase 1: Onboarding Chat Interface — Setup & Installation

## ✅ Что было добавлено в Phase 1

### Frontend Components
- ✅ **Страница `/onboarding`** — Интерактивный интерфейс онбординга с полной навигацией
- ✅ **ChatWindow компонент** — Полнофункциональный чат с ИИ-ассистентом
  - Индикатор печати (typing indicator) для UX
  - Автоматическая прокрутка к новым сообщениям
  - Обработка ошибок сети с graceful degradation
  - История сообщений сохраняется в React state

### Backend Services
- ✅ **SQLAlchemy 2.0 ORM** — Асинхронное подключение к PostgreSQL
  - User модель с телефоном (unique), флагом верификации, timestamps
  - Profile модель с ролью (WORKER/EMPLOYER/UNKNOWN), специализацией, опытом
  - Правильные связи (relationships) с cascade delete
- ✅ **LLMService enhancement** — JSON парсинг и извлечение структурированных данных
  - Система переходит в режим JSON когда собраны все 3 параметра
  - Graceful degradation если Ollama недоступна
  - Graceful error handling с логированием
- ✅ **Database Dependency Injection** — Правильное управление БД сессиями через `get_db()`
- ✅ **docker-compose.yml** — PostgreSQL 15 Alpine для локальной разработки

### Developer Experience (DX)
- ✅ **UTF-8 кодировка везде** — Исправлены кракозябры в консоли Windows
- ✅ **Автоматическое скачивание LLaMA 3** — Модель скачивается при первом запуске
- ✅ **Подавление 404 ошибок PWA** — Создаются placeholder иконки
- ✅ **Цветной вывод процесса** — Красивые логи со статусом каждого шага
- ✅ **Улучшенный start-dev.ps1** — Полностью автоматизированный запуск

---

## 🚀 Пошаговая инструкция

### Шаг 1: Установи Docker Desktop

Docker нужен для PostgreSQL сервиса:

**Windows:**
1. Скачай https://www.docker.com/products/docker-desktop
2. Запусти инсталлер и следуй инструкциям
3. Перезагрузи Windows (обычно требуется)
4. Убедись что Docker запущен (значок в трее)

**Mac/Linux:**
```bash
# macOS (через Homebrew)
brew install docker docker-compose

# Linux (Ubuntu/Debian)
sudo apt-get install docker.io docker-compose
```

**Проверка установки:**
```bash
docker --version
# Docker version 24.0.0+ (ок)
docker-compose --version
# Docker Compose version 2.0+
```

### Шаг 2: Проверь Ollama установку

Ollama должна быть установлена для локального ИИ:

```bash
# Проверка установки
ollama --version
# ollama version 0.0.0

# Если Ollama не установлена:
# Windows: https://ollama.com/download/windows
# Mac: https://ollama.com/download/mac
# Linux: https://ollama.com/download/linux
```

**Важно:** Ollama служба должна работать на фоне:
```bash
# В отдельном терминале:
ollama serve
# Listening on 127.0.0.1:11434
```

### Шаг 3: Запусти PostgreSQL в Docker

Из корня проекта (где находится `infrastructure/docker-compose.yml`):

```bash
# Запуск контейнера
docker-compose -f infrastructure/docker-compose.yml up -d

# Проверка что БД запущена
docker ps | grep stroik_postgres
# CONTAINER ID   IMAGE            NAMES
# abc123...      postgres:15...   stroik_postgres
```

**Логирование (если нужно отладить):**
```bash
docker logs stroik_postgres
```

**Остановка:**
```bash
docker-compose -f infrastructure/docker-compose.yml down
```

### Шаг 4: Запусти приложение

Используй обновленный скрипт (всё делается автоматически):

```powershell
# В PowerShell из корня проекта:
.\start-dev.ps1
```

**Что происходит в скрипте:**
1. ✅ Проверка Ollama (если нет llama3 → скачивание начнется)
2. ✅ Создание placeholder иконок для PWA
3. ✅ Установка Python зависимостей (если нужно)
4. ✅ Запуск Backend в отдельном окне PowerShell
5. ✅ Запуск Frontend в отдельном окне PowerShell

**Чего ожидать:**

```
===================================================
   🏗️  СТРОИК — Интеллектуальная строительная платформа
===================================================

[1/4] Проверка подсистемы ИИ (Ollama)...
  -> Модель 'llama3' не найдена. Начинаю скачивание (ок. 4.7 ГБ)...
  -> Пожалуйста, дождитесь окончания загрузки.
[################################] 100%
  -> Модель успешно загружена!

[2/4] Подготовка статических ассетов...
  -> Заглушки для PWA иконок созданы.

[3/4] Инициализация Backend (FastAPI)...
  -> Зависимости Python установлены.

[4/4] Инициализация Frontend (Next.js)...

===================================================
 ✅ Все сервисы успешно запущены!
 🌐 Frontend: http://localhost:3000
 🧠 Backend API: http://localhost:8000/docs
===================================================
```

### Шаг 5: Проверь что всё работает

**Backend здоров:**
```bash
# В браузере или терминале:
curl http://localhost:8000/health
# {"status": "healthy"}
```

**Swagger документация:**
- Открой http://localhost:8000/docs в браузере
- Увидишь все API endpoints с описанием

**Frontend запущен:**
- http://localhost:3000 — главная страница
- http://localhost:3000/onboarding — чат с ИИ

---

## 💬 Использование ИИ-ассистента

### Тестирование чата через веб-интерфейс

1. Открой http://localhost:3000/onboarding
2. Нажми в поле для ввода
3. Напиши первое сообщение, например: **«Привет»**

### Пример диалога

```
User: Привет! Помоги мне создать профиль.