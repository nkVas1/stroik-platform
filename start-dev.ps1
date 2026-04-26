# start-dev.ps1 - Пуленепробиваемый запуск среды "СТРОИК"
Write-Host "Инициализация проекта СТРОИК..." -ForegroundColor Cyan

$frontendDir = Join-Path $PWD "frontend"
$backendDir = Join-Path $PWD "backend"

# --- 1. Подготовка Backend ---
if (-Not (Test-Path "$backendDir\venv")) {
    Write-Host "Настройка виртуального окружения Python..." -ForegroundColor Yellow
    cd $backendDir
    python -m venv venv
    # Прямой вызов pip из созданного venv для надежности
    & ".\venv\Scripts\python.exe" -m pip install --upgrade pip
    & ".\venv\Scripts\python.exe" -m pip install fastapi uvicorn pydantic ollama sqlalchemy asyncpg alembic
    cd ..
}

# --- 2. Запуск серверов ---
Write-Host "Запуск серверов..." -ForegroundColor Green

# Запуск Backend (прямой вызов python.exe из venv вместо activate)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Запуск FastAPI...'; & '.\venv\Scripts\python.exe' -m uvicorn app.main:app --reload --port 8000"

# Запуск Frontend (с автоматической установкой пакетов, если их нет)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; if (-Not (Test-Path 'node_modules')) { Write-Host 'Установка npm зависимостей...'; npm install }; Write-Host 'Запуск Next.js...'; npm run dev"

Write-Host "Скрипт отработал. Ожидайте запуска в открывшихся окнах." -ForegroundColor DarkGray
