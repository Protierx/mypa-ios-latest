# MYPA Repo File Blueprint
## Proposed Documentation and Project Structure

---

## Philosophy

1. **Docs live next to the code they describe.** Supabase docs go in `/supabase/docs/`, frontend docs in `/frontend/docs/`, etc.
2. **One doc per concern.** Don't combine schema reference with security audit in one file.
3. **Planning docs are ephemeral.** They live in `/docs/planning/` and are archived after execution.
4. **The PRD is the product truth.** Architecture and implementation docs reference it, never contradict it.
5. **No orphan docs.** Every doc has an owner and a review cadence.

---

## Proposed Structure

```
/
├── docs/
│   ├── planning/                          # Execution planning (this sprint)
│   │   ├── MYPA_MASTER_EXECUTION_PLAN_V3.md   # Master plan (this doc)
│   │   ├── MYPA_STEP_BY_STEP_BUILD_PLAYBOOK.md # Week-by-week playbook
│   │   ├── MYPA_ARCHITECTURE_GAP_REPORT.md     # Gap analysis
│   │   ├── MYPA_REPO_FILE_BLUEPRINT.md          # This file
│   │   └── MYPA_OPUS_TASK_PROMPTS.md            # Claude prompt pack
│   │
│   ├── product/                           # Product specs (long-lived)
│   │   ├── PRD.md                         # Canonical PRD (moved from root)
│   │   ├── DESIGN_SPECIFICATION.md        # UI/UX spec (moved from root)
│   │   └── INVESTOR_DECK_NOTES.md         # KPI tree, narrative, milestones
│   │
│   ├── engineering/                       # Technical architecture (long-lived)
│   │   ├── ARCHITECTURE_OVERVIEW.md       # High-level system diagram
│   │   ├── NAVIGATION_SPEC.md             # Route graph, deep links, back behavior
│   │   ├── VOICE_SYSTEM_SPEC.md           # State machine, latency, fallback
│   │   ├── ACTION_SYSTEM_CONTRACT.md      # Intent taxonomy, ActionJSON, validation
│   │   └── EVENT_LOGGING_SPEC.md          # Canonical events, computed metrics, retention
│   │
│   ├── ai/                                # AI-specific documentation
│   │   ├── PROMPT_LIBRARY.md              # System prompts, personality, response style
│   │   ├── MODEL_ROUTING.md               # Capability tiers, config shape, cost control
│   │   └── UNLOCK_ENGINE.md               # 5 unlock levels, gating rules, celebration flow
│   │
│   ├── security/                          # Security and privacy
│   │   ├── RLS_POLICY_REFERENCE.md        # Table-by-table RLS policies
│   │   ├── PRIVACY_RULES.md              # Voice data, retention, circle privacy
│   │   └── RLS_AUDIT_LOG.md              # Dated audit results
│   │
│   ├── qa/                                # Quality assurance
│   │   ├── DEFINITION_OF_DONE.md          # DoD checklist
│   │   ├── ACCEPTANCE_CRITERIA.md         # R1-R5 test scripts
│   │   ├── VOICE_QA_SCRIPT.md             # 20 common + 10 edge case voice commands
│   │   └── EVENT_COVERAGE_AUDIT.md        # Action-to-event mapping checklist
│   │
│   └── release/                           # Release management
│       ├── APP_STORE_CHECKLIST.md         # Legal, assets, submission steps
│       ├── TESTFLIGHT_PLAN.md             # Beta groups, metrics, gates
│       └── LAUNCH_RUNBOOK.md             # Day-of-launch procedures
│
├── PRD.md                                 # Keep symlink/copy in root for visibility
├── PROJECT_HANDOFF_DOCUMENT.md            # Keep (reference for new team members)
├── README.md                              # Updated with new structure pointers
│
├── frontend/
│   └── (existing structure unchanged)
│
├── supabase/
│   ├── (existing structure)
│   └── seed.sql                           # NEW: test data for development
│
└── .cursor/
    └── rules/                             # Cursor AI context rules (already exists)
```

---

## File Definitions

### `/docs/planning/` — Execution Planning

| File | Purpose | Owner | Lifespan |
|------|---------|-------|----------|
| MYPA_MASTER_EXECUTION_PLAN_V3.md | Comprehensive master plan | Both | Archive after v1.0 launch |
| MYPA_STEP_BY_STEP_BUILD_PLAYBOOK.md | Week-by-week task list | Both | Archive after v1.0 launch |
| MYPA_ARCHITECTURE_GAP_REPORT.md | Gap analysis with severity | BE | Update weekly, archive after gaps closed |
| MYPA_REPO_FILE_BLUEPRINT.md | This file — repo structure proposal | BE | Archive after structure is implemented |
| MYPA_OPUS_TASK_PROMPTS.md | Claude prompt pack for implementation | Both | Long-lived (update as architecture evolves) |

### `/docs/product/` — Product Specs

| File | Purpose | Owner | Review Cadence |
|------|---------|-------|---------------|
| PRD.md | Canonical product requirements | Product | Update per major feature decision |
| DESIGN_SPECIFICATION.md | Pixel-perfect UI specs | Design/FE | Update when design changes |
| INVESTOR_DECK_NOTES.md | KPI tree, narrative, financial model | Product | Update before investor conversations |

### `/docs/engineering/` — Technical Architecture

| File | Purpose | Owner | Review Cadence |
|------|---------|-------|---------------|
| ARCHITECTURE_OVERVIEW.md | System diagram: client → Supabase → OpenAI → client. Stack versions. Service inventory. | BE | Update on major architecture changes |
| NAVIGATION_SPEC.md | Route graph with all screens/modals. Deep link contract. Back behavior truth table. Gesture specs. | FE | Update when adding screens/modals |
| VOICE_SYSTEM_SPEC.md | State machine diagram. Transition rules. Latency targets. Fallback path. Barge-in spec. Discreet mode. | FE | Update on voice architecture changes |
| ACTION_SYSTEM_CONTRACT.md | Intent taxonomy. ActionJSON schema. Validation rules. Confidence thresholds. Response templates. | BE | Update when adding actions |
| EVENT_LOGGING_SPEC.md | Canonical event list. Column definitions. Computed metrics formulas. Retention policy. | BE | Update when adding events |

### `/docs/ai/` — AI Documentation

| File | Purpose | Owner | Review Cadence |
|------|---------|-------|---------------|
| PROMPT_LIBRARY.md | MYPA system prompt. Per-context prompts (briefing, brain dump, greeting). Tone examples. Anti-patterns. | FE | Update when tuning personality |
| MODEL_ROUTING.md | Capability tiers (fast/smart/personalized/cached). Config shape. Cost per action estimates. Response caching rules. | BE | Update on model swaps or routing changes |
| UNLOCK_ENGINE.md | 5 unlock levels with triggers. user_model computation logic. Celebration modal flow. Gating consistency rules. | FE+BE | Update when changing unlock thresholds |

### `/docs/security/` — Security and Privacy

| File | Purpose | Owner | Review Cadence |
|------|---------|-------|---------------|
| RLS_POLICY_REFERENCE.md | Table-by-table RLS policies with SQL. Rationale for each policy. Edge cases. | BE | Update on every RLS migration |
| PRIVACY_RULES.md | Voice data handling. Transcript retention. Circle privacy defaults. OpenAI disclosure. Account deletion. Data export. | BE | Update before App Store submission |
| RLS_AUDIT_LOG.md | Dated entries: "Feb 10 — tested User A cannot see User B tasks — PASS." Evidence for compliance. | BE | Update after every RLS test |

### `/docs/qa/` — Quality Assurance

| File | Purpose | Owner | Review Cadence |
|------|---------|-------|---------------|
| DEFINITION_OF_DONE.md | The DoD checklist (functional, UI/UX, AI/unlock, quality). Used for every PR review. | Both | Stable (rarely changes) |
| ACCEPTANCE_CRITERIA.md | R1-R5 acceptance tests with exact steps and expected outcomes. | Both | Update when criteria evolve |
| VOICE_QA_SCRIPT.md | 20 common voice commands + 10 edge cases. Expected action + expected response. Used for regression testing. | FE | Update when adding voice capabilities |
| EVENT_COVERAGE_AUDIT.md | Checklist: every user-facing action → does it emit an event? Percentage coverage. Gaps. | BE | Update weekly during development |

### `/docs/release/` — Release Management

| File | Purpose | Owner | Review Cadence |
|------|---------|-------|---------------|
| APP_STORE_CHECKLIST.md | Privacy policy, terms, nutrition labels, support URL, subscription config, assets, review notes. | BE | Update before each submission |
| TESTFLIGHT_PLAN.md | Beta groups, distribution plan, feedback mechanisms, gate metrics, minimum duration. | Both | Update before each beta cycle |
| LAUNCH_RUNBOOK.md | Day-of procedures: submit → monitor review → respond to questions → announce → monitor crash rate. | Both | Update before launch |

---

## Migration Plan (From Current State)

### Files to Move

| Current Location | New Location | Action |
|-----------------|-------------|--------|
| `/PRD.md` | `/docs/product/PRD.md` + root symlink | Move, keep root copy for visibility |
| `/MYPA_DESIGN_SPECIFICATION.md` | `/docs/product/DESIGN_SPECIFICATION.md` | Move |
| `/MYPA_ARCHITECTURE_PLAN.md` | Archive or merge into `/docs/engineering/` | Archive (superseded by master plan) |
| `/MYPA_FULL_IMPLEMENTATION_GUIDE.md` | Archive | Archive (superseded by playbook) |
| `/PROJECT_HANDOFF_DOCUMENT.md` | Keep in root | Keep (onboarding reference) |

### Files to Create

| File | Priority | Create When |
|------|----------|------------|
| `/supabase/seed.sql` | Week 1 | Day 3 |
| `/docs/engineering/ARCHITECTURE_OVERVIEW.md` | Week 1 | Day 1 (freeze) |
| `/docs/security/RLS_POLICY_REFERENCE.md` | Week 1 | Day 2 (after RLS migration) |
| `/docs/qa/VOICE_QA_SCRIPT.md` | Week 2 | After voice integration |
| `/docs/qa/EVENT_COVERAGE_AUDIT.md` | Week 1 | Day 5 (coverage audit) |
| `/docs/release/APP_STORE_CHECKLIST.md` | Week 4 | Start early, complete Week 6 |

### Files to Delete (After Archive)

| File | Reason |
|------|--------|
| `/MYPA_ARCHITECTURE_PLAN.md` | 131K characters, superseded by master plan + engineering docs |
| `/MYPA_FULL_IMPLEMENTATION_GUIDE.md` | Superseded by step-by-step playbook |
| `/APP_STORE_READINESS.md` (already deleted) | Was in main branch |
| Various audit/progress docs (already deleted) | Were in main branch |

---

## What to Build Now

1. Create `/docs/planning/` and commit the 5 deliverable files.
2. Create `/docs/engineering/ARCHITECTURE_OVERVIEW.md` as a 1-page system diagram.
3. Create `/docs/security/RLS_POLICY_REFERENCE.md` when writing the RLS hardening migration.
4. Create `/supabase/seed.sql` on Day 3.
5. Don't move existing root-level docs yet — that's Week 3+ cleanup. Focus on building, not reorganizing.
