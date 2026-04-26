# start-dev.ps1 - СТРОИК Ultimate Edition
# ---------------------------------------------------------
# 1. Настройка кодировки UTF-8 (Избавляемся от кракозябр)
[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

Clear-Host
Write-Host "===================================================" -ForegroundColor DarkCyan
Write-Host "   🏗️  СТРОИК — Интеллектуальная строительная платформа" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor DarkCyan
Write-Host ""

$frontendDir = Join-Path $PWD "frontend"
$backendDir = Join-Path $PWD "backend"
$infraDir = Join-Path $PWD "infrastructure"

# ---------------------------------------------------------
# 2. Проверка и настройка локального ИИ (Ollama)
# ---------------------------------------------------------
Write-Host "[1/4] Проверка подсистемы ИИ (Ollama)..." -ForegroundColor Yellow
if (Get-Command "ollama" -ErrorAction SilentlyContinue) {
    $models = ollama list
    if ($models -notmatch "llama3") {
        Write-Host "  -> Модель 'llama3' не найдена. Начинаю скачивание (ок. 4.7 ГБ)..." -ForegroundColor Magenta
        Write-Host "  -> Пожалуйста, дождитесь окончания загрузки." -ForegroundColor DarkGray
        ollama pull llama3
        Write-Host "  -> Модель успешно загружена!" -ForegroundColor Green
    } else {
        Write-Host "  -> Модель 'llama3' готова к работе." -ForegroundColor Green
    }
} else {
    Write-Host "  [ОШИБКА] Ollama не установлена! Скачайте с https://ollama.com/" -ForegroundColor Red
    exit
}

# ---------------------------------------------------------
# 3. Фикс 404 ошибок PWA (Создание заглушек иконок)
# ---------------------------------------------------------
Write-Host "[2/4] Подготовка статических ассетов..." -ForegroundColor Yellow
$iconsDir = Join-Path $frontendDir "public\icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
    # Создаем пустые файлы, чтобы подавить 404 ошибки в логах Next.js
    New-Item -ItemType File -Path "$iconsDir\icon-192x192.png" | Out-Null
    New-Item -ItemType File -Path "$iconsDir\icon-512x512.png" | Out-Null
    Write-Host "  -> Заглушки для PWA иконок созданы." -ForegroundColor Green
} else {
    Write-Host "  -> Ассеты в порядке." -ForegroundColor Green
}

# ---------------------------------------------------------
# 4. Проверка и запуск Backend (FastAPI)
# ---------------------------------------------------------
Write-Host "[3/4] Инициализация Backend (FastAPI)..." -ForegroundColor Yellow
if (-Not (Test-Path "$backendDir\venv")) {
    Write-Host "  -> Создание виртуального окружения Python..." -ForegroundColor Magenta
    cd $backendDir
    python -m venv venv
    & ".\venv\Scripts\python.exe" -m pip install --upgrade pip -q
    & ".\venv\Scripts\python.exe" -m pip install fastapi uvicorn pydantic ollama sqlalchemy asyncpg alembic -q
    cd ..
    Write-Host "  -> Зависимости Python установлены." -ForegroundColor Green
}

# Запуск Backend в отдельном окне (с принудительным UTF-8)
$backendCmd = "[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding; cd backend; Write-Host '🚀 Backend запущен (http://localhost:8000)' -ForegroundColor Green; & '.\venv\Scripts\python.exe' -m uvicorn app.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# ---------------------------------------------------------
# 5. Проверка и запуск Frontend (Next.js)
# ---------------------------------------------------------
Write-Host "[4/4] Инициализация Frontend (Next.js)..." -ForegroundColor Yellow
$frontendCmd = "[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding; cd frontend; "
if (-Not (Test-Path "$frontendDir\node_modules")) {
    Write-Host "  -> Установка NPM зависимостей (это займет пару минут)..." -ForegroundColor Magenta
    $frontendCmd += "npm install; "
}
$frontendCmd += "Write-Host '🚀 Frontend запущен (http://localhost:3000)' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "===================================================" -ForegroundColor DarkCyan
Write-Host " ✅ Все сервисы успешно запущены!" -ForegroundColor Green
Write-Host " 🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host " 🧠 Backend API: http://localhost:8000/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor DarkCyan
