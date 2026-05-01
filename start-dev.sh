#!/usr/bin/env bash
# =============================================================================
#  СТРОИК — единый скрипт запуска dev-окружения для Linux / macOS
#  Использование:  chmod +x start-dev.sh && ./start-dev.sh
#  Флаги:
#    --skip-deps         не переустанавливать зависимости
#    --skip-migrations   не запускать alembic upgrade
#    --skip-ollama       не трогать Ollama (если запущен вручную)
# =============================================================================

set -euo pipefail

# --- цвета ------------------------------------------------------------------
if [[ -t 1 ]]; then
    C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'
    C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'
    C_BLUE=$'\033[34m'; C_CYAN=$'\033[36m'; C_GREY=$'\033[90m'
else
    C_RESET=""; C_BOLD=""; C_DIM=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_CYAN=""; C_GREY=""
fi

section() { echo; echo "${C_CYAN}═══════════════════════════════════════════════════════════════${C_RESET}"; \
            echo "${C_BOLD}${C_CYAN}  $1${C_RESET}"; \
            echo "${C_CYAN}═══════════════════════════════════════════════════════════════${C_RESET}"; }
step()    { echo "  ${C_YELLOW}▸${C_RESET} $1"; }
ok()      { echo "  ${C_GREEN}✓${C_RESET} $1"; }
warn()    { echo "  ${C_YELLOW}⚠${C_RESET} $1"; }
fail()    { echo "  ${C_RED}✗ $1${C_RESET}"; }
info()    { echo "    ${C_GREY}$1${C_RESET}"; }

die() { fail "$1"; echo; echo "${C_RED}Запуск прерван.${C_RESET}"; exit 1; }

# --- флаги ------------------------------------------------------------------
SKIP_DEPS=0; SKIP_MIGRATIONS=0; SKIP_OLLAMA=0
for arg in "$@"; do
    case "$arg" in
        --skip-deps) SKIP_DEPS=1 ;;
        --skip-migrations) SKIP_MIGRATIONS=1 ;;
        --skip-ollama) SKIP_OLLAMA=1 ;;
        -h|--help)
            echo "СТРОИК dev-launcher"
            echo "Флаги: --skip-deps  --skip-migrations  --skip-ollama"
            exit 0
            ;;
        *) warn "Неизвестный флаг: $arg" ;;
    esac
done

# --- баннер -----------------------------------------------------------------
clear
echo
echo "${C_YELLOW}  ███████╗████████╗██████╗  ██████╗ ██╗██╗  ██╗${C_RESET}"
echo "${C_YELLOW}  ██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗██║██║ ██╔╝${C_RESET}"
echo "${C_YELLOW}  ███████╗   ██║   ██████╔╝██║   ██║██║█████╔╝ ${C_RESET}"
echo "${C_YELLOW}  ╚════██║   ██║   ██╔══██╗██║   ██║██║██╔═██╗ ${C_RESET}"
echo "${C_BOLD}  ███████║   ██║   ██║  ██║╚██████╔╝██║██║  ██╗${C_RESET}"
echo "${C_BOLD}  ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═╝${C_RESET}"
echo "${C_GREY}    Интеллектуальная платформа стройки  •  dev-launcher${C_RESET}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

[[ -d "$BACKEND_DIR" && -d "$FRONTEND_DIR" ]] || die "Не найдены backend/ или frontend/. Запускайте из корня репозитория."

# =========================================================================
#  Шаг 1.  Pre-flight
# =========================================================================
section "Шаг 1/6 · Проверка окружения"

if ! command -v python3 >/dev/null 2>&1; then die "python3 не найден. Установите Python 3.11+"; fi
PY_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
PY_MAJOR=${PY_VER%%.*}; PY_MINOR=${PY_VER##*.}
if (( PY_MAJOR < 3 || (PY_MAJOR == 3 && PY_MINOR < 11) )); then
    die "Требуется Python ≥ 3.11, найден $PY_VER"
fi
ok "Python $PY_VER"

if ! command -v node >/dev/null 2>&1; then die "Node.js не найден. Установите Node 18+"; fi
NODE_VER=$(node --version | sed 's/v//')
NODE_MAJOR=${NODE_VER%%.*}
if (( NODE_MAJOR < 18 )); then die "Требуется Node ≥ 18, найдено $NODE_VER"; fi
ok "Node.js v$NODE_VER"

command -v npm >/dev/null 2>&1 || die "npm не найден"
ok "npm $(npm --version)"

if command -v ollama >/dev/null 2>&1; then
    ok "Ollama установлен"
    OLLAMA_AVAILABLE=1
else
    warn "Ollama не установлен — Llama3-fallback будет недоступен"
    info "Скачать: https://ollama.com/download"
    OLLAMA_AVAILABLE=0
fi

# =========================================================================
#  Шаг 2.  .env
# =========================================================================
section "Шаг 2/6 · Конфигурация (.env)"

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
    if [[ -f "$BACKEND_DIR/.env.example" ]]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        ok "backend/.env создан из .env.example"
        warn "Заполните GOOGLE_API_KEY и SECRET_KEY в backend/.env"
    fi
else
    ok "backend/.env уже существует"
fi

if [[ ! -f "$FRONTEND_DIR/.env.local" ]]; then
    if [[ -f "$FRONTEND_DIR/.env.example" ]]; then
        cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env.local"
        ok "frontend/.env.local создан из .env.example"
    fi
else
    ok "frontend/.env.local уже существует"
fi

# =========================================================================
#  Шаг 3.  Backend venv + зависимости
# =========================================================================
section "Шаг 3/6 · Backend · Python venv + зависимости"

VENV_DIR="$BACKEND_DIR/venv"
VENV_PY="$VENV_DIR/bin/python"

if [[ ! -x "$VENV_PY" ]]; then
    step "Создаю виртуальное окружение…"
    python3 -m venv "$VENV_DIR"
    ok "venv создан"
fi

if (( SKIP_DEPS == 0 )); then
    step "Устанавливаю зависимости из pyproject.toml…"
    "$VENV_PY" -m pip install --upgrade pip --quiet --disable-pip-version-check
    ( cd "$BACKEND_DIR" && "$VENV_PY" -m pip install -e . --quiet --disable-pip-version-check ) \
        || die "Не удалось установить backend-зависимости"
    ok "Backend-зависимости актуальны"
else
    warn "Пропуск установки зависимостей (--skip-deps)"
fi

# =========================================================================
#  Шаг 4.  Alembic
# =========================================================================
section "Шаг 4/6 · База данных · Alembic"

if (( SKIP_MIGRATIONS == 0 )); then
    step "Применяю миграции (alembic upgrade head)…"
    ( cd "$BACKEND_DIR" && "$VENV_PY" -m alembic upgrade head ) \
        || die "Миграции не применились"
    ok "Схема БД актуальна"
else
    warn "Пропуск миграций (--skip-migrations)"
fi

# =========================================================================
#  Шаг 5.  Ollama
# =========================================================================
section "Шаг 5/6 · Ollama · фоновая служба + модель qwen2.5:7b"

if (( OLLAMA_AVAILABLE == 1 && SKIP_OLLAMA == 0 )); then
    if ! pgrep -x ollama >/dev/null 2>&1; then
        step "Запускаю ollama serve в фоне…"
        nohup ollama serve >/tmp/ollama-stroik.log 2>&1 &
        sleep 2
        ok "ollama serve запущен (PID $!)"
    else
        ok "ollama уже запущен"
    fi

    if ollama list 2>/dev/null | grep -q "qwen2.5:7b"; then
        ok "Модель qwen2.5:7b готова"
    else
        step "Скачиваю модель qwen2.5:7b (~4.4 ГБ, один раз)…"
        ollama pull qwen2.5:7b
        ok "qwen2.5:7b загружена"
    fi
elif (( SKIP_OLLAMA == 1 )); then
    warn "Ollama пропущен (--skip-ollama)"
else
    warn "Ollama недоступен — fallback не будет работать (Gemini продолжит работу)"
fi

# =========================================================================
#  Шаг 6.  Frontend + параллельный запуск
# =========================================================================
section "Шаг 6/6 · Frontend · npm + параллельный запуск"

if [[ ! -d "$FRONTEND_DIR/node_modules" && SKIP_DEPS -eq 0 ]]; then
    step "Устанавливаю npm-зависимости (первый запуск)…"
    ( cd "$FRONTEND_DIR" && npm install --silent ) || die "npm install завершился ошибкой"
    ok "npm-зависимости установлены"
else
    ok "node_modules в порядке"
fi

LOG_DIR="$ROOT_DIR/.dev-logs"
mkdir -p "$LOG_DIR"

step "Запускаю backend (FastAPI) → $LOG_DIR/backend.log"
( cd "$BACKEND_DIR" && "$VENV_PY" -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1 \
    >"$LOG_DIR/backend.log" 2>&1 ) &
BACKEND_PID=$!
ok "Backend PID $BACKEND_PID"

step "Запускаю frontend (Next.js) → $LOG_DIR/frontend.log"
( cd "$FRONTEND_DIR" && npm run dev >"$LOG_DIR/frontend.log" 2>&1 ) &
FRONTEND_PID=$!
ok "Frontend PID $FRONTEND_PID"

cleanup() {
    echo
    warn "Останавливаю сервисы…"
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    wait 2>/dev/null || true
    ok "Готово."
}
trap cleanup EXIT INT TERM

echo
echo "${C_GREEN}═══════════════════════════════════════════════════════════════${C_RESET}"
echo "${C_BOLD}${C_GREEN}  ✓ ВСЕ СЕРВИСЫ ЗАПУЩЕНЫ${C_RESET}"
echo "${C_GREEN}═══════════════════════════════════════════════════════════════${C_RESET}"
echo "    Frontend  →  http://localhost:3000"
echo "    Backend   →  http://127.0.0.1:8000/docs (Swagger)"
echo "    Ollama    →  http://127.0.0.1:11434"
echo
echo "${C_GREY}  Логи: $LOG_DIR/{backend,frontend}.log${C_RESET}"
echo "${C_GREY}  Нажмите Ctrl+C, чтобы остановить оба сервиса.${C_RESET}"
echo

# Ждём, пока пользователь нажмёт Ctrl+C — иначе скрипт завершится и убьёт сервисы
wait
