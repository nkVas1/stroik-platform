# 🏗️ PHASE 3.1 - Marketplace Core Implementation

**Status:** ACTIVE DEVELOPMENT (Session 2)  
**Start Date:** 2026-04-27  
**Objective:** Implement marketplace order flow: employers create projects via chat → LLM generates TZ → workers see projects in Live Feed

---

## ✅ What's Implemented (This Session)

### 1. Database Layer ✓
**File:** `backend/app/models/db_models.py`

```python
# New enum for project lifecycle
class ProjectStatus(str, Enum):
    OPEN = "open"  # Available for applications
    IN_PROGRESS = "in_progress"  # Worker assigned
    COMPLETED = "completed"  # Project finished
    CANCELLED = "cancelled"  # Cancelled by employer

# New ORM model
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    budget = Column(Integer, nullable=False)
    required_specialization = Column(String, nullable=False)
    status = Column(String, default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    employer = relationship("User", backref="projects")
```

### 2. LLM Service Layer ✓
**File:** `backend/app/services/llm_service.py`

**Changes:**
- Modified `_get_prompt_for_state()` to be **role-aware**
- Employers (STATE 2): Get prompt that generates project creation command
- Workers (STATE 2): Get prompt that updates specialization

**Return Format (NEW):**
```json
{
  "action": "create_project",
  "data": {
    "title": "Укладка плитки в ванной",
    "description": "Нужно уложить 25м² керамогранита. Помещение готово к отделке.",
    "budget": 50000,
    "required_specialization": "плиточник"
  }
}
```

OR:

```json
{
  "action": "update_profile",
  "data": {
    "specialization": "электрик",
    "experience_years": 8
  }
}
```

**Implementation Detail:**
```python
if current_user.profile.role.value == "employer":
    # STATE 2 for employers: Create project
    return {
        "role": "system",
        "content": EMPLOYER_STATE2_PROMPT + '\n{"action": "create_project", ...}'
    }
else:
    # STATE 2 for workers: Update profile
    return {
        "role": "system",
        "content": WORKER_STATE2_PROMPT + '\n{"action": "update_profile", ...}'
    }
```

### 3. API Endpoints ✓
**File:** `backend/app/main.py`

#### Endpoint 1: Update POST /api/chat
```python
# Now handles action="create_project"
if action == "create_project" and current_user:
    new_project = Project(
        employer_id=current_user.id,
        title=data_patch.get("title"),
        description=data_patch.get("description"),
        budget=data_patch.get("budget"),
        required_specialization=data_patch.get("required_specialization"),
        status="open"
    )
    db.add(new_project)
    await db.commit()
    logger.info(f"✅ Project created: {new_project.title} (ID: {new_project.id})")
```

#### Endpoint 2: NEW GET /api/projects (Live Feed)
```python
@app.get("/api/projects")
async def get_open_projects(db: AsyncSession = Depends(get_db)):
    """
    Returns 10 latest OPEN projects for Live Feed.
    No auth required - visible to all workers.
    """
    result = await db.execute(
        select(Project)
        .where(Project.status == "open")
        .order_by(Project.created_at.desc())
        .limit(10)
    )
    projects = result.scalars().all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "budget": p.budget,
            "specialization": p.required_specialization,
            "created_at": p.created_at.isoformat(),
            "employer_id": p.employer_id
        }
        for p in projects
    ]
```

### 4. Frontend Dashboard ✓
**File:** `frontend/src/app/dashboard/page.tsx`

**Changes:**
- Added `Project` TypeScript type
- Added `projects` state with `useState<Project[]>([])`
- Updated `useEffect` to fetch both profile AND projects
- Replaced placeholder with dynamic project cards

**Live Feed Rendering:**
```tsx
{projects.length > 0 ? (
  projects.map((project) => (
    <div key={project.id} className="...skeuo-brutal...">
      <h3 className="font-black text-lg">{project.title}</h3>
      <p className="text-sm opacity-70">{project.description}</p>
      <p className="font-black text-xl text-brand">
        {project.budget.toLocaleString()} ₽
      </p>
    </div>
  ))
) : (
  <div>No projects yet</div>
)}
```

---

## 🔄 Data Flow (Complete Loop)

```
1. EMPLOYER (in chat)
   "Мне нужно положить плитку в ванной, около 25м², бюджет 50000"
   ↓
2. LLM SERVICE (State Machine)
   - Detects: role=="employer" && state==2
   - Returns: {"action": "create_project", "data": {...TZ...}}
   ↓
3. API HANDLER (POST /api/chat)
   - Receives: action="create_project"
   - Creates: Project(employer_id=123, title=..., status="open")
   - Saves to DB
   ↓
4. WORKER (Dashboard)
   - Calls: GET /api/projects
   - Receives: [Project{id:1, title:"Плитка", budget:50000, ...}, ...]
   - Renders: "Live Feed" с карточками проектов
   ↓
5. WORKER APPLIES (Next Phase)
   - Clicks: "Откликнуться"
   - Creates: Order/Application record
   - Employer approves or rejects
```

---

## 📊 Database Schema (NEW)

```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    employer_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    budget INTEGER NOT NULL,
    required_specialization VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'open',  -- open|in_progress|completed|cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_employer ON projects(employer_id);
CREATE INDEX idx_projects_created ON projects(created_at DESC);
```

---

## 🧪 Manual Testing Checklist

**Before Continuing to Next Phase:**

- [ ] Backend starts without errors: `python3 run.py`
- [ ] Database migrates correctly: Alembic sees new Project model
- [ ] Employer can describe project in chat
- [ ] LLM returns `{"action": "create_project", ...}` 
- [ ] Project appears in DB with status="open"
- [ ] GET /api/projects returns the new project
- [ ] Frontend dashboard loads projects without auth required
- [ ] Worker sees project in Live Feed with correct budget/title
- [ ] Multiple projects render as cards with brutal styling

**Test User Flow:**
```bash
1. Start 3 terminals (backend, frontend, ollama)
2. Register as EMPLOYER with verification_level >= 1
3. Go to chat, describe project
4. Check DB: SELECT * FROM projects WHERE status='open'
5. Open dashboard in incognito (no token) - should see /api/projects works
6. Register as WORKER
7. Go to dashboard, verify Live Feed shows projects
```

---

## 🚨 Known Limitations (Phase 3.1)

- ⚠️ No order/application system yet (Phase 3.2)
- ⚠️ No payment integration (Phase 3.3)
- ⚠️ No project status updates when worker applies
- ⚠️ Employers can't edit projects after creation
- ⚠️ No soft delete - cancelled projects shown in queries
- ⚠️ Single worker per project (no bidding yet)

---

## 📋 Next Steps (Phase 3.2+)

### Phase 3.2 - Order Management
- [ ] Create Order/Application model linking Worker + Project
- [ ] Add POST /api/projects/{id}/apply endpoint
- [ ] LLM generates worker profile summaries for employer review
- [ ] Email notifications for employers when workers apply

### Phase 3.3 - Payment & Contracts
- [ ] Integrate payment processor (Stripe/YooKassa)
- [ ] Create Contract model with escrow logic
- [ ] Auto-release funds on completion

### Phase 4.3+ - Extended Features
- [ ] Dispute resolution system
- [ ] Review/rating system
- [ ] Skill-based project recommendations
- [ ] Analytics dashboard for employers

---

## 📝 Modified Files

| File | Changes |
|------|---------|
| `backend/app/models/db_models.py` | Added ProjectStatus enum + Project ORM class |
| `backend/app/services/llm_service.py` | Updated _get_prompt_for_state() for role-aware actions |
| `backend/app/main.py` | Updated POST /api/chat handler + added GET /api/projects |
| `frontend/src/app/dashboard/page.tsx` | Added projects state + dynamic Live Feed rendering |
| `FOR_NEW_CHAT.md` | Updated phase info and latest status |

---

## 🔗 Related Documentation

- [PROJECT_EXPORT.md](./PROJECT_EXPORT.md) - Complete technical reference
- [PHASE4.2_NATIVE_JSON_MODE.md](./PHASE4.2_NATIVE_JSON_MODE.md) - LLM prompt architecture
- [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) - System design overview
