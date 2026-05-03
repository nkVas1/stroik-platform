# Vercel Deploy — инструкция

## Что было не так

- `rootDirectory` — **не валидное поле** `vercel.json`. Только Vercel Dashboard UI.
- `version: 2` — устаревшее поле, вызывает предупреждения.
- Все предыдущие фиксы уходили в ветку `main`, а Vercel отслеживает `master`.

## Шаги для деплоя (один раз)

1. Открой [Vercel Dashboard](https://vercel.com/dashboard) → проект **stroik-platform**
2. **Settings** → **General** → найди блок **Root Directory**
3. Нажми **Edit** → введи `frontend` → нажми **Save**
4. Перейди в **Deployments** → нажми **Redeploy**

## Структура конфига

```
storik-platform/
├── vercel.json           ← для случая если Root Directory не выставлен в UI
├── frontend/
│   ├── vercel.json       ← конфиг который работает когда Root Dir = frontend
│   ├── next.config.mjs   ← next-pwa отключён на Vercel
│   └── package.json
└── backend/
```

## Переменные окружения (Vercel Dashboard → Environment Variables)

| Переменная | Значение | Окружение |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | оставь пустым (рерайты в vercel.json) | Production |

> API запросы: `/api/*` → `https://stroik-api.onrender.com/api/*`
