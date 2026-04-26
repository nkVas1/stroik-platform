# Строик Platform Backend

API сервер для платформы СТРОИК, написанный на FastAPI.

## Структура

```
backend/
├── app/
│   ├── api/           # API роутеры
│   ├── core/          # Конфигурация
│   ├── models/        # Pydantic модели
│   ├── services/      # Бизнес-логика
│   └── main.py        # Точка входа
├── pyproject.toml     # Зависимости
└── README.md
```

## Установка

```bash
python -m venv venv
.\venv\Scripts\activate
pip install -e .
```

## Запуск

```bash
uvicorn app.main:app --reload --port 8000
```

API будет доступен на http://localhost:8000/docs
