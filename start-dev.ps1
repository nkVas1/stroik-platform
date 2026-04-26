# start-dev.ps1 - Автоматизированный запуск среды разработки "СТРОИК"

Write-Host "Инициализация проекта СТРОИК..." -ForegroundColor Cyan

# 1. Проверка и запуск Frontend (Next.js)
$frontendDir = Join-Path $PWD "frontend"
if (-Not (Test-Path $frontendDir)) {
    Write-Host "Frontend не найден. Создаем Next.js приложение..." -ForegroundColor Yellow
    # Используем npm
    npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
}

# 2. Проверка и запуск Backend (Python FastAPI)
$backendDir = Join-Path $PWD "backend"
if (-Not (Test-Path $backendDir)) {
    Write-Host "Backend не найден. Создаем структуру FastAPI..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $backendDir
    New-Item -ItemType Directory -Path "$backendDir/app"
    New-Item -ItemType File -Path "$backendDir/app/main.py" -Value "from fastapi import FastAPI`n`napp = FastAPI(title='Stroik API')`n`n@app.get('/')`ndef read_root():`n    return {'status': 'ok'}"
    
    Write-Host "Настройка виртуального окружения Python..." -ForegroundColor Yellow
    cd $backendDir
    python -m venv venv
    .\venv\Scripts\activate
    pip install fastapi uvicorn pydantic ollama
    cd ..
}

# 3. Запуск серверов в фоновых процессах
Write-Host "Запуск серверов..." -ForegroundColor Green

# Запуск Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload --port 8000"

# Запуск Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Успешно! Frontend: http://localhost:3000 | Backend: http://localhost:8000/docs" -ForegroundColor Green
