# 🎯 PHASE 4.1 - QUICK REFERENCE

**Status:** ✅ COMPLETE | **Last Updated:** 27.04.2026

---

## 🚀 Start Services (5 minutes)

```bash
# Terminal 1: Backend (from project root)
cd backend && python3 run.py
# or: python -m uvicorn app.main:app --reload

# Terminal 2: Frontend (from project root)
cd frontend && npm run dev

# Terminal 3: Ollama (if needed)
ollama serve
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://127.0.0.1:8000
- API Docs: http://127.0.0.1:8000/docs

---

## 🔑 Critical Files Changed

```
frontend/src/components/chat/ChatWindow.tsx
  └─ Added: isAuthenticated check + conditional button render

backend/app/services/llm_service.py
  └─ Refactored: State Machine pattern (3 focused prompts)

backend/app/main.py
  └─ Updated: pass current_user to llm_service

📚 Documentation:
  ├─ PROJECT_ARCHITECTURE.md (400+ lines)
  ├─ PHASE4.1_REFACTOR.md (300+ lines)
  ├─ PHASE4.1_COMPLETE.md (262 lines)
  └─ README.md (updated)
```

---

## 🧪 Quick Test

### Test 1: Health Check
```bash
curl http://127.0.0.1:8000/health
```

### Test 2: Chat (New User)
```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "I am a builder"}
    ]
  }'
```

### Test 3: UI Check
1. Open http://localhost:3000/onboarding
2. Button "В кабинет" should **NOT be visible** (no token)
3. Complete onboarding
4. Button should now **be visible** (token in localStorage)
5. Click button → should redirect to /dashboard (no page reload)

---

## 🤖 State Machine Architecture

```
STATE 0 (Onboarding - new user)
  └─ Prompt: "Ask for role (worker/employer) and entity type"
  └─ Tokens: ~200
  └─ Example response: "Worker" → JSON_DATA: {"role": "worker"}

STATE 1 (Verification - verification_level < 1)
  └─ Prompt: "Ask for FIO and city"
  └─ Tokens: ~250
  └─ Example response: "Ivan Petrov from Moscow" → JSON_DATA: {...}

STATE 2 (Profile Help - verification_level >= 1)
  └─ Prompt: "Help with profile updates, translate legal filters"
  └─ Tokens: ~300
  └─ Example response: "Help with languages" → updates language_proficiency
```

**Selection Logic:**
```python
if not current_user:
    return STATE_0_PROMPT
elif current_user.profile.verification_level < 1:
    return STATE_1_PROMPT
else:
    return STATE_2_PROMPT
```

---

## 📊 API Endpoints

### Chat (Hybrid Mode)
```bash
POST /api/chat

Without token (new user):
{
  "messages": [{"role": "user", "content": "I am a carpenter"}]
}
→ Creates new User + Profile
→ Returns is_complete=true + access_token

With token (existing user):
Headers: Authorization: Bearer <token>
{
  "messages": [{"role": "user", "content": "My city is Moscow"}]
}
→ Updates existing Profile
→ Returns is_complete=false (continues chat)
```

### Get User Profile
```bash
GET /api/users/me
Headers: Authorization: Bearer <token>

Response:
{
  "id": 1,
  "role": "worker",
  "entity_type": "physical",
  "verification_level": 1,
  "fio": "Ivan Petrov",
  "location": "Moscow",
  "language_proficiency": "Russian native",
  "work_authorization": "RF Citizenship"
}
```

---

## 🐛 Bugs Fixed in 4.1

| Bug | Fix |
|-----|-----|
| LLM goes crazy | State Machine: 3 small prompts instead of 1 huge |
| Page reloads on button click | type="button" + e.preventDefault() |
| Button visible to guests | Added isAuthenticated state + localStorage check |
| JSON in chat output | Use "JSON_DATA:" marker for extraction |

---

## 📚 Documentation Links

- **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** - Complete tech reference (400+ lines)
- **[PHASE4.1_REFACTOR.md](PHASE4.1_REFACTOR.md)** - Detailed bug fixes (300+ lines)
- **[PHASE4.1_COMPLETE.md](PHASE4.1_COMPLETE.md)** - Completion checklist (262 lines)
- **[README.md](README.md)** - Main readme with examples
- **[QUICK_START.md](QUICK_START.md)** - Developer setup guide

---

## 🔄 Git History

```
c27ffc6 - Add Phase 4.1 Completion Checklist
xxxxxxx - Phase 4.1: State Machine Architecture + Bug Fixes + Complete Documentation
21df32c - Phase 4: Database schema + verification levels + hybrid chat mode
```

---

## ⚠️ Known Limitations

- SQLite for dev only (upgrade to PostgreSQL for production)
- Ollama requires 8GB+ RAM
- No rate limiting yet
- Document upload for level 3 (Phase 4b)

---

## 🔜 Next Steps

1. **Phase 4b**: Document upload endpoint (passport verification)
2. **Phase 5**: Matching engine (find workers/projects)
3. **Phase 6**: Payment integration
4. **Phase 7**: Contracts and escrow

---

## 💡 Tips

- **Token expires**: 7 days (check `exp` in JWT)
- **Token location**: `localStorage.stroik_token`
- **Model running slow?** Check: `ollama list` and `ollama serve` process
- **Backend not starting?** Check PYTHONPATH: `echo $PYTHONPATH` or run from `/backend` dir

---

**Version:** 4.1-quick-ref  
**Status:** ✅ Production Ready
