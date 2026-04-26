param()

[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
Clear-Host

Write-Host "===================================================" -ForegroundColor DarkCyan
Write-Host "   STROIK - Intelligent Construction Platform" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor DarkCyan
Write-Host ""

$frontendDir = Join-Path $PWD "frontend"
$backendDir = Join-Path $PWD "backend"
$infraDir = Join-Path $PWD "infrastructure"

Write-Host "[1/4] Checking Ollama Installation..." -ForegroundColor Yellow
$ollamaExists = $null -ne (Get-Command "ollama" -ErrorAction SilentlyContinue)
if ($ollamaExists) {
    try {
        $models = & ollama list 2>$null
        $hasLlama = $models -match "llama3"
        if (-not $hasLlama) {
            Write-Host "  -> Downloading llama3 model (approx 4.7 GB)..." -ForegroundColor Magenta
            & ollama pull llama3
            Write-Host "  -> Model downloaded successfully!" -ForegroundColor Green
        }
        else {
            Write-Host "  -> llama3 model is ready." -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  -> Ollama service check: $_" -ForegroundColor Yellow
    }
}
else {
    Write-Host "  [ERROR] Ollama not installed! Download from https://ollama.com/" -ForegroundColor Red
    exit 1
}

Write-Host "[2/4] Preparing static assets..." -ForegroundColor Yellow
$iconsDir = Join-Path $frontendDir "public/icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
    New-Item -ItemType File -Path "$iconsDir/icon-192x192.png" -Force | Out-Null
    New-Item -ItemType File -Path "$iconsDir/icon-512x512.png" -Force | Out-Null
    Write-Host "  -> PWA icon placeholders created." -ForegroundColor Green
}
else {
    Write-Host "  -> Assets ready." -ForegroundColor Green
}

Write-Host "[3/4] Initializing Backend (FastAPI)..." -ForegroundColor Yellow
if (-Not (Test-Path "$backendDir\venv")) {
    Write-Host "  -> Creating Python virtual environment..." -ForegroundColor Magenta
    cd $backendDir
    python -m venv venv
    & ".\venv\Scripts\python.exe" -m pip install --upgrade pip -q
    & ".\venv\Scripts\python.exe" -m pip install fastapi uvicorn pydantic ollama sqlalchemy aiosqlite alembic -q
    cd ..
    Write-Host "  -> Python dependencies installed." -ForegroundColor Green
}

$backendCmd = "[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding; cd backend; Write-Host 'Backend running (http://localhost:8000)' -ForegroundColor Green; & '.\venv\Scripts\python.exe' -m uvicorn app.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Write-Host "[4/4] Initializing Frontend (Next.js)..." -ForegroundColor Yellow
$frontendCmd = "[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding; cd frontend; "
if (-Not (Test-Path "$frontendDir\node_modules")) {
    Write-Host "  -> Installing npm dependencies..." -ForegroundColor Magenta
    $frontendCmd += "npm install; "
}
$frontendCmd += "Write-Host 'Frontend running (http://localhost:3000)' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "===================================================" -ForegroundColor DarkCyan
Write-Host " SUCCESS: All services started!" -ForegroundColor Green
Write-Host " Frontend: http://localhost:3000" -ForegroundColor White
Write-Host " Backend API: http://localhost:8000/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor DarkCyan
