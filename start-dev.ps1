# =============================================================================
#  STROIK -- единый скрипт запуска dev-окружения для Windows / PowerShell
#  Назначение: одной командой развернуть полноценную локальную среду:
#    1) проверка окружения (Python >= 3.11, Node >= 18, Ollama)
#    2) установка/обновление зависимостей (pip, npm)
#    3) подготовка .env файлов из .env.example при отсутствии
#    4) применение миграций Alembic (alembic upgrade head)
#    5) запуск Ollama в фоне + предзагрузка модели llama3
#    6) запуск backend (FastAPI/uvicorn) и frontend (Next.js) в отдельных окнах
#  Использование:  pwsh ./start-dev.ps1   или   powershell -File ./start-dev.ps1
#  Совместимость: Windows PowerShell 5.1 и PowerShell 7+
#  Кодировка файла: UTF-8 with BOM (обязательно для PS 5.1 + кириллицы).
# =============================================================================

param(
    [switch]$SkipDeps,        # пропустить переустановку зависимостей
    [switch]$SkipMigrations,  # пропустить alembic upgrade
    [switch]$SkipOllama       # не трогать ollama (если уже запущен вручную)
)

$ErrorActionPreference = "Stop"
[console]::InputEncoding  = New-Object System.Text.UTF8Encoding
[console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
Clear-Host

# --- утилиты вывода --------------------------------------------------------

function Write-Section($title) {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor DarkCyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "===============================================================" -ForegroundColor DarkCyan
}
function Write-Step($msg)    { Write-Host "  >> $msg" -ForegroundColor Yellow }
function Write-Ok($msg)      { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Fail($msg)    { Write-Host "  [X]  $msg" -ForegroundColor Red }
function Write-Info($msg)    { Write-Host "       $msg" -ForegroundColor DarkGray }

function Stop-OnFail($message) {
    Write-Fail $message
    Write-Host ""
    Write-Host "Запуск прерван. Устраните проблему и попробуйте снова." -ForegroundColor Red
    exit 1
}

# --- баннер ----------------------------------------------------------------

Write-Host ""
Write-Host "  ===========================================" -ForegroundColor DarkYellow
Write-Host "        S T R O I K  --  dev launcher       " -ForegroundColor Yellow
Write-Host "    Интеллектуальная платформа стройки      " -ForegroundColor Gray
Write-Host "  ===========================================" -ForegroundColor DarkYellow
Write-Host ""

$frontendDir = Join-Path $PSScriptRoot "frontend"
$backendDir  = Join-Path $PSScriptRoot "backend"

if (-not (Test-Path $backendDir) -or -not (Test-Path $frontendDir)) {
    Stop-OnFail "Не найдены каталоги backend/ или frontend/. Запускайте скрипт из корня репозитория."
}

# =========================================================================
#  Шаг 1.  Pre-flight: проверка версий инструментов
# =========================================================================
Write-Section "Шаг 1/6 -- Проверка окружения"

# Python ----
try {
    $pyVersionRaw = (& python --version) 2>&1
    if ($pyVersionRaw -notmatch "Python\s+(\d+)\.(\d+)") {
        Stop-OnFail "Python не найден в PATH. Установите Python 3.11+ -- https://www.python.org/"
    }
    $pyMajor = [int]$Matches[1]; $pyMinor = [int]$Matches[2]
    if ($pyMajor -lt 3 -or ($pyMajor -eq 3 -and $pyMinor -lt 11)) {
        Stop-OnFail "Требуется Python >= 3.11, найден $pyVersionRaw"
    }
    Write-Ok "Python $pyMajor.$pyMinor"
} catch {
    Stop-OnFail "Python не доступен: $_"
}

# Node ----
try {
    $nodeVersionRaw = (& node --version) 2>&1
    if ($nodeVersionRaw -notmatch "v(\d+)\.(\d+)") {
        Stop-OnFail "Node.js не найден. Установите Node 18+ -- https://nodejs.org/"
    }
    $nodeMajor = [int]$Matches[1]
    if ($nodeMajor -lt 18) {
        Stop-OnFail "Требуется Node >= 18, найдено $nodeVersionRaw"
    }
    Write-Ok "Node.js $nodeVersionRaw"
} catch {
    Stop-OnFail "Node.js не доступен: $_"
}

# npm ----
try {
    $npmVersion = (& npm --version) 2>&1
    Write-Ok "npm $npmVersion"
} catch {
    Stop-OnFail "npm не доступен"
}

# Ollama ----
$ollamaExists = $null -ne (Get-Command "ollama" -ErrorAction SilentlyContinue)
if ($ollamaExists) {
    Write-Ok "Ollama установлен"
} else {
    Write-Warn "Ollama не установлен -- Llama3-fallback будет недоступен"
    Write-Info "Скачать: https://ollama.com/download"
}

# =========================================================================
#  Шаг 2.  .env файлы (создаём из .env.example при отсутствии)
# =========================================================================
Write-Section "Шаг 2/6 -- Конфигурация (.env)"

$envBackend  = Join-Path $backendDir  ".env"
$envFrontend = Join-Path $frontendDir ".env.local"

if (-not (Test-Path $envBackend)) {
    $template = Join-Path $backendDir ".env.example"
    if (Test-Path $template) {
        Copy-Item $template $envBackend
        Write-Ok "backend/.env создан из .env.example"
        Write-Warn "Заполните GOOGLE_API_KEY и SECRET_KEY в backend/.env"
    } else {
        Write-Warn "backend/.env.example не найден -- пропускаю"
    }
} else {
    Write-Ok "backend/.env уже существует"
}

if (-not (Test-Path $envFrontend)) {
    $template = Join-Path $frontendDir ".env.example"
    if (Test-Path $template) {
        Copy-Item $template $envFrontend
        Write-Ok "frontend/.env.local создан из .env.example"
    } else {
        Write-Warn "frontend/.env.example не найден -- пропускаю"
    }
} else {
    Write-Ok "frontend/.env.local уже существует"
}

# =========================================================================
#  Шаг 3.  Backend -- venv + зависимости
# =========================================================================
Write-Section "Шаг 3/6 -- Backend: Python venv + зависимости"

$venvPath   = Join-Path $backendDir "venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Step "Создаю виртуальное окружение..."
    Push-Location $backendDir
    & python -m venv venv
    Pop-Location
    Write-Ok "venv создан"
}

if (-not $SkipDeps) {
    Write-Step "Устанавливаю зависимости из pyproject.toml..."
    & $venvPython -m pip install --upgrade pip --quiet --disable-pip-version-check
    Push-Location $backendDir
    # Editable-install подтянет [project.dependencies]
    & $venvPython -m pip install -e . --quiet --disable-pip-version-check
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Stop-OnFail "Не удалось установить backend-зависимости"
    }
    Pop-Location
    Write-Ok "Backend-зависимости актуальны"
} else {
    Write-Warn "Пропуск установки зависимостей (-SkipDeps)"
}

# =========================================================================
#  Шаг 4.  Миграции Alembic
# =========================================================================
Write-Section "Шаг 4/6 -- База данных: Alembic"

if (-not $SkipMigrations) {
    Write-Step "Применяю миграции (alembic upgrade head)..."
    Push-Location $backendDir
    & $venvPython -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Stop-OnFail "Миграции не применились"
    }
    Pop-Location
    Write-Ok "Схема БД актуальна"
} else {
    Write-Warn "Пропуск миграций (-SkipMigrations)"
}

# =========================================================================
#  Шаг 5.  Ollama -- запуск службы в фоне + модель llama3
# =========================================================================
Write-Section "Шаг 5/6 -- Ollama: фоновая служба + модель llama3"

if ($ollamaExists -and -not $SkipOllama) {
    $ollamaProc = Get-Process ollama -ErrorAction SilentlyContinue
    if (-not $ollamaProc) {
        Write-Step "Запускаю ollama serve в фоне..."
        Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Ok "ollama serve запущен"
    } else {
        Write-Ok "ollama уже запущен (PID $($ollamaProc.Id))"
    }

    try {
        $modelList = & ollama list 2>$null
        if ($modelList -match "llama3") {
            Write-Ok "Модель llama3 готова"
        } else {
            Write-Step "Скачиваю модель llama3 (~4.7 GB, один раз)..."
            & ollama pull llama3
            Write-Ok "llama3 загружена"
        }
    } catch {
        Write-Warn "Не удалось проверить модели Ollama: $_"
    }
} elseif ($SkipOllama) {
    Write-Warn "Ollama пропущен (-SkipOllama)"
} else {
    Write-Warn "Ollama недоступен -- fallback не будет работать (Gemini продолжит работу)"
}

# =========================================================================
#  Шаг 6.  Frontend -- npm install + запуск dev-серверов
# =========================================================================
Write-Section "Шаг 6/6 -- Frontend: npm + параллельный запуск"

if (-not (Test-Path (Join-Path $frontendDir "node_modules")) -and -not $SkipDeps) {
    Write-Step "Устанавливаю npm-зависимости (первый запуск)..."
    Push-Location $frontendDir
    & npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Stop-OnFail "npm install завершился ошибкой"
    }
    Pop-Location
    Write-Ok "npm-зависимости установлены"
} else {
    Write-Ok "node_modules в порядке"
}

# --- запуск backend в новом окне ---
$backendCmd = @"
[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding;
Set-Location -LiteralPath '$backendDir';
Write-Host '=========================================' -ForegroundColor DarkCyan;
Write-Host '  STROIK :: Backend (FastAPI)            ' -ForegroundColor Cyan;
Write-Host '  http://127.0.0.1:8000/docs             ' -ForegroundColor Cyan;
Write-Host '=========================================' -ForegroundColor DarkCyan;
& '$venvPython' -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd | Out-Null
Write-Ok "Backend запущен в отдельном окне"

# --- запуск frontend в новом окне ---
$frontendCmd = @"
[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding;
Set-Location -LiteralPath '$frontendDir';
Write-Host '=========================================' -ForegroundColor DarkCyan;
Write-Host '  STROIK :: Frontend (Next.js)           ' -ForegroundColor Cyan;
Write-Host '  http://localhost:3000                  ' -ForegroundColor Cyan;
Write-Host '=========================================' -ForegroundColor DarkCyan;
npm run dev
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd | Out-Null
Write-Ok "Frontend запущен в отдельном окне"

# =========================================================================
#  Финал
# =========================================================================
Write-Host ""
Write-Host "===============================================================" -ForegroundColor DarkGreen
Write-Host "  [OK] ВСЕ СЕРВИСЫ ЗАПУЩЕНЫ" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor DarkGreen
Write-Host "    Frontend  ->  http://localhost:3000" -ForegroundColor White
Write-Host "    Backend   ->  http://127.0.0.1:8000/docs (Swagger)" -ForegroundColor White
Write-Host "    Ollama    ->  http://127.0.0.1:11434" -ForegroundColor White
Write-Host ""
Write-Host "  Закройте окна сервисов, чтобы остановить разработку." -ForegroundColor Gray
Write-Host ""
