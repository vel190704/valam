# VALAM — Wealth Assessment and Level Advancement Model

VALAM is a gamified personal finance platform for Indian retail investors — think Duolingo for investing. Users complete a 4-step onboarding assessment, receive a **VALAM Score** (continuous 0–8 scale) representing their current wealth position, see a **Potential Score** showing where they could reach, and get a deterministic + AI-coached action plan to level up. The platform tracks investments, income, net worth, SIP plans, milestones, and learning progress across eight named wealth levels.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [How to Run Locally](#how-to-run-locally)
4. [Environment Variables](#environment-variables)
5. [VALAM Scoring Algorithm](#valam-scoring-algorithm)
6. [Dual-Score Ratchet System](#dual-score-ratchet-system)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)
9. [Key Data Flows](#key-data-flows)
10. [Feature Descriptions](#feature-descriptions)
11. [Auth Flow](#auth-flow)
12. [SIP Automation](#sip-automation)
13. [AI Coaching Pipeline](#ai-coaching-pipeline)
14. [CSS Variable Design System](#css-variable-design-system)
15. [Important Patterns and Gotchas](#important-patterns-and-gotchas)
16. [Branch Strategy](#branch-strategy)

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend framework | Next.js (App Router) | ^16.2.9 | Pages, routing, client-side rendering |
| UI library | React | 19.2.4 | Component model |
| Styling | Tailwind CSS v4 + inline CSS vars | 4.x | Design system, dark/light mode |
| Language | TypeScript | ^5 | Type safety across frontend |
| Backend framework | Express | ^5.2.1 | REST API server |
| Backend runtime | Node.js (ESM modules) | 18+ | Server runtime |
| Database + Auth | Supabase (PostgreSQL + GoTrue) | ^2.x | Storage, RLS, JWT auth, OAuth |
| AI inference | Groq SDK | ^1.2.1 | LLM coaching explanations (llama-3.3-70b) |
| Email | Resend | ^6.14.0 | Contact form delivery |
| Scoring engine | `frontend/lib/valam.ts` | — | Pure TS scoring algorithm, no deps |
| Testing | Playwright | ^1.61.1 | End-to-end audit tests |

---

## Project Structure

```
valamhq/
├── frontend/                          # Next.js app (port 3000)
│   ├── app/
│   │   ├── layout.tsx                 # Root layout — mounts Navbar, Footer, ThemeProvider
│   │   ├── globals.css                # CSS variable definitions for light + dark mode
│   │   ├── context/
│   │   │   └── themecontext.tsx       # ThemeProvider + useTheme() hook, writes body.dark class
│   │   ├── page.tsx                   # Landing page — hero, CTA, auth-aware routing guard
│   │   ├── login/page.tsx             # Email/password login (Supabase JS client)
│   │   ├── signup/page.tsx            # Email/password sign-up
│   │   ├── forgot-password/page.tsx   # Email-based password reset trigger
│   │   ├── reset-password/page.tsx    # Password reset confirmation (reads URL hash token)
│   │   ├── auth/callback/page.tsx     # Google OAuth PKCE code exchange (MUST be page.tsx)
│   │   ├── onboarding/
│   │   │   ├── step1/page.tsx         # Age input
│   │   │   ├── step2/page.tsx         # Income bracket
│   │   │   ├── step3/page.tsx         # Savings rate + investment bracket + Financial Health
│   │   │   └── step4/page.tsx         # Experience level → runs valam.ts → posts to backend
│   │   ├── result/page.tsx            # Post-onboarding score reveal page
│   │   ├── dashboard/page.tsx         # Main hub — hero slider, AI task card, dual scores, tabs
│   │   ├── portfolio/page.tsx         # Investment log, MiniChart, MF sub-type, SIP badge
│   │   ├── income/page.tsx            # Income entries, FY savings rate, source breakdown
│   │   ├── networth/page.tsx          # Assets + liabilities tracker, net worth total
│   │   ├── allocation/page.tsx        # Actual vs. suggested donut charts, gap table, AI insight
│   │   ├── milestones/page.tsx        # 80 achievement badges across 4 categories
│   │   ├── sip/page.tsx               # SIP plan manager — create, pause, cancel, history
│   │   ├── learning/
│   │   │   ├── [level]/page.tsx       # Level overview — topic grid, level switcher pills
│   │   │   └── [level]/[topicOrder]/page.tsx  # Lesson slideshow — concept slides, self-check
│   │   ├── profile/page.tsx           # View/edit profile, score breakdown, score history
│   │   ├── about/page.tsx             # Marketing — about page (uses InfoPageSection)
│   │   ├── vision/page.tsx            # Marketing — vision page (uses InfoPageSection)
│   │   └── contact/page.tsx           # Contact form → POST /contact → Resend email
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             # Marketing nav — hidden on all app routes via appPages list
│   │   │   └── Footer.tsx             # Marketing footer — same appPages list (must match Navbar)
│   │   └── sections/
│   │       └── InfoPageSection.tsx    # Reusable section for /about and /vision pages
│   └── lib/
│       ├── valam.ts                   # Scoring engine — positionScore, potentialScore, level map
│       ├── supabase.ts                # Supabase browser client (anon key, PKCE flow)
│       ├── allocation.ts              # Age+risk based allocation suggestions, MF category maps
│       ├── api.ts                     # Typed fetch helpers for backend endpoints
│       └── recommendations.ts        # Static recommendation text by level + goal
│
├── backend/                           # Express API server (port 5000)
│   ├── server.js                      # All routes, middleware, constants, startup
│   └── lib/
│       ├── valam.js                   # JS mirror of frontend/lib/valam.ts (keep in sync)
│       ├── roadmapEngine.js           # Deterministic task selection — no LLM, pure scoring logic
│       ├── aiCoach.js                 # Groq call — narrates task chosen by roadmapEngine
│       ├── roadmapCache.js            # Score-keyed cache — skips Groq when score unchanged
│       ├── milestoneEngine.js         # Evaluates and unlocks milestone achievements
│       ├── sipCron.js                 # Daily SIP execution — finds due plans, inserts investments
│       ├── savingsRate.js             # FY and monthly savings-rate calculations
│       └── financialYear.js           # FY boundary helpers (April 1 – March 31, India)
│
├── backend/migrations/                # Run manually in Supabase Dashboard SQL Editor
│   ├── add_learning_hub.sql           # Creates learning_content and learning_progress tables
│   ├── seed_learning_content.sql      # Inserts 154 rows across levels 2–7 (run after above)
│   ├── add_roadmap_cache.sql          # Adds 4 roadmap cache columns to profiles
│   ├── add_dual_scores.sql            # Adds calculated_score, current_score, financial_health_score
│   ├── add_financial_health.sql       # Adds emergency_fund, high_interest_debt, health_insurance
│   ├── add_sip_plans.sql              # Creates sip_plans table + sip_id FK on investments
│   ├── add_vehicle_loan_category.sql  # Adds vehicle_loan to networth_items category CHECK
│   ├── income_rename_category_to_source.sql  # Renames income_entries.category → source
│   └── investments_date_optional.sql  # Makes investments.date nullable
│
├── docs/
│   └── FINANCIAL_HEALTH_PROPOSAL.md  # Design doc for the Financial Health factor
│
├── tests/
│   ├── playwright.config.cjs          # Playwright config — base URL localhost:3000
│   ├── global-setup.cjs               # Saves auth session to test-results/auth-state.json
│   └── valam_audit.spec.js            # End-to-end audit across all major flows
│
├── AGENTS.md                          # Claude Code / AI agent instructions
├── CLAUDE.md                          # Points to AGENTS.md
└── README.md                          # This file
```

---

## How to Run Locally

**Prerequisites:** Node.js 18+, npm. No PostgreSQL installation needed — the database is hosted on Supabase.

### Terminal 1 — Backend

```bash
cd backend
npm install
# Create backend/.env.local with the variables listed below
node server.js
# ✅ VALAM backend running on port 5000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
# Create frontend/.env.local with the variables listed below
npm run dev
# Next.js ready on http://localhost:3000
```

Open http://localhost:3000. The landing page loads without auth. Login or sign up to access the app.

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `EADDRINUSE :5000` | Previous backend process still running | `lsof -ti:5000 \| xargs kill` |
| `EADDRINUSE :3000` | Previous Next.js process still running | `lsof -ti:3000 \| xargs kill` |
| `Cannot find module 'groq-sdk'` | `npm install` run at repo root instead of inside `backend/` | `cd backend && npm install` |
| `Invalid API key` from Groq | Wrong or missing `GROQ_API_KEY` | Verify at console.groq.com → API Keys |
| Dashboard shows "Loading…" forever | Backend not running or wrong `NEXT_PUBLIC_BACKEND_URL` | Confirm backend is on port 5000 |
| Contact form 503 | Backend started before `RESEND_API_KEY` was added to `.env.local` | Restart backend after adding the key |
| `Auth timeout` in requireUser | Supabase JWT validation taking >5 s | Check network; retry — timeout is 5 s then 401 |

---

## Environment Variables

### `frontend/.env.local`

| Variable | Purpose | Value for local dev |
|----------|---------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | From Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key — safe to expose | Same as above |
| `NEXT_PUBLIC_BACKEND_URL` | Base URL of the Express backend | `http://localhost:5000` |

### `backend/.env.local`

| Variable | Purpose | Value for local dev |
|----------|---------|---------------------|
| `SUPABASE_URL` | Supabase project URL | From Supabase Dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Anon key — used only for JWT verification in `requireUser` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — bypasses RLS for all DB writes | Supabase Dashboard → Project Settings → API → service_role |
| `GROQ_API_KEY` | Groq API key for LLM inference | console.groq.com → API Keys |
| `RESEND_API_KEY` | Resend API key for contact form emails | resend.com → API Keys |
| `FRONTEND_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

> **Security:** `SUPABASE_SERVICE_ROLE_KEY` has full unrestricted database access — it bypasses all Row Level Security policies. It must never appear in frontend code or browser bundles. It lives only in `backend/.env.local`.

The backend loads env vars in this order on startup:
1. `.env` (base config)
2. `.env.local` (backend secrets — GROQ_API_KEY, RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY)
3. `../frontend/.env.local` (shared vars — Supabase URL and anon key)

---

## VALAM Scoring Algorithm

Implemented in `frontend/lib/valam.ts` (TypeScript) and mirrored in `backend/lib/valam.js` (JavaScript). Both files must stay in sync. All score components are on a 1–8 integer scale; the weighted sum is a continuous float also bounded 0–8.

### Current Position Score (Where You Are Now)

Measures present-day wealth-building position. Uses **actual net worth from the database** when available; falls back to investment bracket midpoints when the user has not yet added networth items.

```
positionScore = 0.30 × netWorthScore
              + 0.30 × wealthVelocityScore
              + 0.20 × savingsScore
              + 0.10 × incomeScore
              + 0.10 × experienceScore
```

| Factor | Weight | Input | Scoring brackets |
|--------|--------|-------|-----------------|
| **Net Worth** | 30% | Actual ₹ net worth from `networth_items` | <₹0→1, <₹50K→2, <₹2L→3, <₹10L→4, <₹25L→5, <₹50L→6, <₹1Cr→7, ≥₹1Cr→8 |
| **Wealth Velocity** | 30% | Net worth ÷ age (₹/year) | <₹5K→1, <₹25K→2, <₹50K→3, <₹1L→4, <₹2L→5, <₹5L→6, <₹10L→7, ≥₹10L→8 |
| **Savings Rate** | 20% | `savingsRate` bracket key | <2%→1, 2–5→2, 5–10→3, 10–15→4, 15–20→5, 20–30→6, 30–40→7, ≥40→8 |
| **Income** | 10% | `income` bracket key | <3L→1, 3–5L→2, 5–8L→3, 8–12L→4, 12–20L→5, 20–30L→6, 30–50L→7, ≥50L→8 |
| **Experience (Knowledge)** | 10% | `experience` key | beginner→2, learning→4, intermediate→6, advanced→8 |

**Fallback when no net worth data exists:** `netWorthScore` defaults to 2 (neutral). Wealth velocity uses investment bracket midpoints (`<10k`→₹5K, `10k-1L`→₹55K, `1L-5L`→₹3L, `5L-25L`→₹15L, `25L+`→₹30L) divided by age.

**Live recalculation:** On every `GET /profile` call, the backend fetches fresh savings/income figures from FY transactions (April 1–March 31) and recomputes the position score with live data rather than relying on the stored snapshot.

### Future Potential Score (Where You Could Go)

Measures long-term ceiling. Excludes net worth and wealth velocity (lagging indicators); adds age premium for remaining time horizon.

```
potentialScore = 0.45 × savingsScore
               + 0.35 × ageScore
               + 0.10 × incomeScore
               + 0.10 × experienceScore
```

| Factor | Weight | Scoring brackets |
|--------|--------|-----------------|
| **Savings Rate** | 45% | Same as position score |
| **Age (time horizon)** | 35% | ≤24→8, ≤29→7, ≤34→6, ≤39→5, ≤44→4, ≤49→3, ≤59→2, 60+→1 |
| **Income** | 10% | Same as position score |
| **Experience** | 10% | Same as position score |

### Financial Health Score (Auxiliary — Not in Scoring Formula)

Computed by `scoreFinancialHealth(emergencyFund, highInterestDebt, healthInsurance)`. Used **only** by `roadmapEngine.js` as an override rule: if `financialHealthScore ≤ 3`, the first task is always a Financial Health task (emergency fund, debt clearance, or insurance) regardless of which positionScore factor has the largest gap.

```
base = 4
+2 if emergencyFund is '3-6months' or '6months+'
−1 if emergencyFund is 'none'
+1 if healthInsurance is 'yes'
−2 if highInterestDebt is 'significant'
−1 if highInterestDebt is 'some'
```

### Wealth Levels

| Score range | Level | Name |
|-------------|-------|------|
| 0.00 – 1.99 | 1 | Seed |
| 2.00 – 2.99 | 2 | Explorer |
| 3.00 – 3.99 | 3 | Builder |
| 4.00 – 4.99 | 4 | Accelerator |
| 5.00 – 5.99 | 5 | Achiever |
| 6.00 – 6.99 | 6 | Wealth Creator |
| 7.00 – 7.49 | 7 | Wealth Architect |
| 7.50 – 8.00 | 8 | Legend |

Level 7 has a narrower band (0.5 wide vs 1.0 for others) — it is intentionally harder to transit through. The level formula is: `score >= 7.5 ? 8 : Math.floor(score)`.

Frontend constant: `LEVEL_NAMES_ARR = ['Seed','Explorer','Builder','Accelerator','Achiever','Wealth Creator','Wealth Architect','Legend']` (0-indexed, so `LEVEL_NAMES_ARR[level - 1]` gives the name).

### Worked Example

**Inputs:** age=28, income=`8L-12L`, savingsRate=`20-30`, experience=`learning`  
**DB net worth:** ₹8,00,000 (assets ₹10L − liabilities ₹2L)

**Component scores:**

| Factor | Calculation | Score |
|--------|-------------|-------|
| Net Worth | ₹8,00,000 → between ₹2L and ₹10L | 4 |
| Wealth Velocity | ₹8,00,000 ÷ 28 = ₹28,571/yr → between ₹25K and ₹50K | 3 |
| Savings Rate | `20-30` bracket | 6 |
| Income | `8L-12L` bracket | 4 |
| Experience | `learning` | 4 |
| Age | 28 → ≤29 | 7 |

**Position score:** `0.30×4 + 0.30×3 + 0.20×6 + 0.10×4 + 0.10×4 = 1.20 + 0.90 + 1.20 + 0.40 + 0.40 = 4.10 → Level 4 (Accelerator)`

**Potential score:** `0.45×6 + 0.35×7 + 0.10×4 + 0.10×4 = 2.70 + 2.45 + 0.40 + 0.40 = 5.95 → Level 5 (Achiever)`

---

## Dual-Score Ratchet System

VALAM maintains two scores per user to prevent visible regression when market conditions temporarily reduce net worth:

| Column | Meaning |
|--------|---------|
| `calculated_score` | Always the freshly computed positionScore from the current `GET /profile` call |
| `current_score` | High-water mark — only ever increases, never decreases |

**Logic on each `GET /profile`:**

```
if calculatedScore > storedCurrentScore:
  → "promotion"  — update both calculated_score and current_score (ratchet up)
  → also update valam_score, valam_level, valam_level_name

elif calculatedScore < storedCurrentScore:
  → "regression" — update calculated_score only; current_score stays at high-water mark

else:
  → "stable" — update calculated_score only
```

The frontend dashboard receives `{ calculatedScore, currentScore, scoreStatus }` and displays both: the current score as the primary number and the potential score alongside it. The `scoreStatus` field (`"promotion"` | `"regression"` | `"stable"`) can drive animations or badges.

---

## Database Schema

All tables live in Supabase (PostgreSQL project ref `mtjaqptamwjcfvifomsc`). The backend uses the **service role key** for all writes (bypasses RLS). The browser Supabase client (anon key) is used only for auth flows.

### `profiles`

Stores each user's VALAM assessment results and computed scores.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid UNIQUE | FK → `auth.users.id` |
| `name` | text | Display name from onboarding |
| `age` | integer | |
| `income` | text | Bracket key e.g. `'8L-12L'` |
| `savings_rate` | text | Bracket key e.g. `'20-30'` |
| `investments` | text | Bracket key e.g. `'1L-5L'` (used as fallback for WV when no NW data) |
| `experience` | text | `'beginner'` \| `'learning'` \| `'intermediate'` \| `'advanced'` |
| `goal` | text | `'wealth'` \| `'retirement'` \| `'emergency'` \| `'home'` \| `'education'` \| `'business'` |
| `valam_score` | numeric | Position score at last promotion |
| `valam_level` | integer | 1–8 |
| `valam_level_name` | text | e.g. `'Accelerator'` |
| `calculated_score` | numeric | Always the freshest computed score |
| `current_score` | numeric | High-water mark (ratchet — never decreases) |
| `potential_score` | numeric | |
| `potential_level` | integer | |
| `potential_level_name` | text | |
| `wealth_velocity` | numeric | Net worth ÷ age (₹/year) |
| `savings_score` | numeric | Component score 1–8 |
| `investments_score` | numeric | Wealth velocity score 1–8 |
| `income_score` | numeric | Component score 1–8 |
| `experience_score` | numeric | Component score 1–8 |
| `age_score` | numeric | Component score 1–8 |
| `financial_health_score` | numeric | Auxiliary score — updated on every GET /profile |
| `emergency_fund` | text | `'none'` \| `'1-2months'` \| `'3-6months'` \| `'6months+'` |
| `high_interest_debt` | text | `'none'` \| `'some'` \| `'significant'` |
| `health_insurance` | text | `'yes'` \| `'no'` |
| `onboarded` | boolean | False until step4 posts assessment |
| `cached_roadmap_explanation` | text | Last Groq-generated coaching text |
| `cached_roadmap_task_type` | text | Task type at cache write time |
| `cached_roadmap_score_snapshot` | numeric | positionScore when cache was written |
| `cached_roadmap_generated_at` | timestamptz | Cache timestamp |
| `created_at` | timestamptz | |

**RLS:** Enabled. Backend uses service role to bypass.

### `investments`

Per-user investment log.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users.id` |
| `date` | date | **Nullable** — entries without dates display as `—` |
| `type` | text | `'mf'` \| `'stock'` \| `'fd'` \| `'crypto'` \| `'bond'` \| `'etf'` \| `'realestate'` |
| `mf_type` | text | Set only when `type = 'mf'`: `'largecap'` \| `'midcap'` \| `'smallcap'` \| `'nifty50'` \| `'flexicap'` \| `'international'` \| `'debt'` \| `'commodity'` |
| `amount` | numeric | ₹ value |
| `note` | text | Optional label |
| `sip_id` | uuid | FK → `sip_plans.id` ON DELETE SET NULL — set for auto-logged SIP entries |

**RLS:** Enabled.

### `sip_plans`

Systematic Investment Plans — recurring investment schedules.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users.id` |
| `investment_type` | text | `'mf'` \| `'stock'` \| `'fd'` \| `'crypto'` \| `'bond'` \| `'etf'` (not realestate) |
| `mf_type` | text | Required when `investment_type = 'mf'`: `'index'` \| `'flexicap'` \| `'midcap'` \| `'largecap'` \| `'smallcap'` \| `'elss'` \| `'hybrid'` |
| `amount` | decimal(14,2) | ₹ amount per execution |
| `frequency` | text | `'monthly'` \| `'weekly'` |
| `start_date` | date | First execution date |
| `next_execution_date` | date | Advances by cron after each execution |
| `status` | text | `'active'` \| `'paused'` \| `'cancelled'` |
| `note` | text | Optional |
| `created_at` / `updated_at` | timestamptz | |

**Index:** `sip_plans_next_exec_idx` on `(next_execution_date, status) WHERE status = 'active'` — used by the daily cron to efficiently find due SIPs.

**RLS:** Enabled.

### `income_entries`

Monthly income records.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users.id` |
| `date` | date | **Required** — used for FY savings rate calculations |
| `source` | text | `'salary'` \| `'freelance'` \| `'business'` \| `'rental'` \| `'interest'` \| `'dividend'` \| `'other'` |
| `amount` | numeric | ₹ value |
| `note` | text | |

**Note:** The column was originally named `category`. A migration renamed it to `source` for clarity. Any code before that migration may still reference `category`.

**RLS:** Enabled.

### `networth_items`

Assets and liabilities snapshot items.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users.id` |
| `category` | text | One of the categories below |
| `label` | text | Free-text name e.g. `'Home Loan'`, `'HDFC FD'` |
| `amount` | numeric | ₹ value |
| `note` | text | |

**Valid categories:**

| Category | Type | Used in |
|----------|------|---------|
| `cash` | Asset | Net worth calc, emergency fund estimate |
| `emergency` | Asset | Net worth calc, emergency fund estimate |
| `property` | Asset | Net worth calc |
| `vehicle` | Asset | Net worth calc |
| `other_asset` | Asset | Net worth calc |
| `debt` | Liability | Subtracted from net worth |
| `emi` | Liability | Subtracted from net worth |
| `vehicle_loan` | Liability | Subtracted from net worth |
| `other_liability` | Liability | Subtracted from net worth |

The backend determines type by checking: `LIABILITY_CATS = Set(['debt', 'emi', 'other_liability', 'vehicle_loan'])`.

**RLS:** Enabled.

### `learning_content`

Static curriculum — seeded once by SQL, never written by users.

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `level` | integer | 2–7 (Level 1 has no content yet; Level 8 Legend has no structured content) |
| `topic_order` | integer | 1–N within the level (8 topics per level) |
| `topic_name` | text | e.g. `'Why Invest at All?'` |
| `sub_concept_order` | integer | Slide number within topic |
| `sub_concept_name` | text | Slide title |
| `explanation` | text | Body text shown on the slide |
| `check_question` | text | Self-check question at end of slide |
| `check_answer` | text | Answer revealed on "Show Answer" click |

**Unique constraint:** `(level, topic_order, sub_concept_order)`.  
**RLS:** Disabled — public read, admin write only.

### `learning_progress`

Per-user topic completion state.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users.id` |
| `level` | integer | |
| `topic_order` | integer | |
| `status` | text | `'not_started'` \| `'continue'` \| `'completed'` |
| `last_viewed_at` | timestamptz | Updated on every `POST /learning/progress` |
| `completed_at` | timestamptz | Set when status first becomes `'completed'` |

**Unique constraint:** `(user_id, level, topic_order)` — upserted on every progress update.  
**Index:** `idx_learning_progress_user_viewed` on `(user_id, last_viewed_at DESC)` — used by `GET /learning/recent`.  
**RLS:** Enabled.

### `milestones`

Static milestone definitions (seeded by admin, not modified by users).

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | |
| `category` | text | `'networth'` \| `'investment'` \| `'income'` \| `'savings'` |
| `title` | text | Display title |
| `description` | text | Full description |
| `threshold` | numeric | ₹ value or % that must be reached |
| `icon` | text | Emoji |

### `user_milestones`

Records when a milestone was first unlocked for a user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users.id` |
| `milestone_id` | integer | FK → `milestones.id` |
| `unlocked_at` | timestamptz | First time the threshold was crossed |

**RLS:** Enabled.

---

## API Reference

All authenticated routes require the header: `Authorization: Bearer <supabase_access_token>`

The token is Supabase's JWT access token. The backend verifies it by calling `supabase.auth.getUser(token)` with a 5-second timeout. On timeout the middleware returns `401 "Auth timeout — please retry"`.

### Auth Routes

| Method | Route | Auth | Body / Params | Response |
|--------|-------|------|--------------|----------|
| POST | `/auth/signup` | No | `{ email, password, name, age, assessment? }` | `{ userId, message }` |
| POST | `/auth/login` | No | `{ email, password }` | `{ accessToken, user: { id, email, name, age } }` |
| GET | `/auth/me` | Yes | — | `{ user: { id, email, name, age } }` |

### Profile Routes

| Method | Route | Auth | Body / Params | Response |
|--------|-------|------|--------------|----------|
| GET | `/profile` | Yes | — | `{ profile, scoreStatus, calculatedScore, currentScore, investments, networthItems, incomeEntries, liveSavingsRate, monthlySavingsRate }` |
| POST | `/profile/ensure` | Yes | `{ name?, age? }` | `{ profile }` — creates profile row if missing, no-ops if exists |
| POST | `/profile/save-assessment` | Yes | `{ name, age, income, savingsRate, investments, experience, goal, valamScore, valamLevel, valamLevelName, potentialScore, potentialLevel, potentialLevelName, breakdown, emergencyFund?, highInterestDebt?, healthInsurance? }` | `{ profileId }` |

**`GET /profile` response shape:**

```js
{
  profile: {
    id, userId, name, age, income, savingsRate, investments, experience, goal,
    valamScore, valamLevel, valamLevelName,
    potentialScore, potentialLevel, potentialLevelName,
    wealthVelocity, onboarded,
    breakdown: { savingsScore, investmentsScore, incomeScore, experienceScore, ageScore },
    recommendation: { headline, summary, steps, products, milestone, warning },
    createdAt
  },
  scoreStatus: "promotion" | "regression" | "stable",
  calculatedScore: number,   // freshly computed this request
  currentScore: number,      // high-water mark (ratchet)
  investments: [{ id, date, type, amount, note }],
  networthItems: [{ id, category, label, amount }],
  incomeEntries: [{ id, date, source, category, amount }],
  liveSavingsRate: number,   // FY-to-date savings rate %
  monthlySavingsRate: number // current month savings rate %
}
```

### Investment Routes

| Method | Route | Auth | Body | Response |
|--------|-------|------|------|----------|
| GET | `/investments` | Yes | — | `{ investments: [{ id, date, type, mf_type, amount, note, sip_id }] }` |
| POST | `/investments` | Yes | `{ type, amount, date?, mfType?, note? }` | `{ investment }` |
| DELETE | `/investments/:id` | Yes | — | `{ success: true }` |

**Validation:** `type` must be one of `VALID_INVESTMENT_TYPES`. When `type = 'mf'`, optional `mfType` must be one of `VALID_PORTFOLIO_MF_TYPES` if provided.

### SIP Routes

| Method | Route | Auth | Body / Params | Response |
|--------|-------|------|--------------|----------|
| GET | `/sips` | Yes | — | `{ sips: [{ ...sip, history_count }] }` |
| POST | `/sips` | Yes | `{ investment_type, mf_type?, amount, frequency, start_date, note? }` | `{ sip, immediateInvestment }` |
| PATCH | `/sips/:id` | Yes | `{ amount?, note?, status? }` | `{ sip }` |
| DELETE | `/sips/:id` | Yes | — | `{ success: true }` |
| GET | `/sips/:id/history` | Yes | — | `{ history: [{ id, date, amount, note }] }` |

**On creation:** if `start_date` is today or in the past, the SIP executes immediately (inserts an investment row) and advances `next_execution_date` to the next cycle beyond today.

### Net Worth Routes

| Method | Route | Auth | Body | Response |
|--------|-------|------|------|----------|
| GET | `/networth` | Yes | — | `{ items: [{ id, category, label, amount }] }` |
| POST | `/networth` | Yes | `{ category, label, amount, note? }` | `{ item }` |
| DELETE | `/networth/:id` | Yes | — | `{ success: true }` |

### Income Routes

| Method | Route | Auth | Body | Response |
|--------|-------|------|------|----------|
| GET | `/income` | Yes | — | `{ entries: [{ id, date, source, amount }] }` |
| POST | `/income` | Yes | `{ date, source, amount, note? }` | `{ entry }` |
| DELETE | `/income/:id` | Yes | — | `{ success: true }` |

### Milestone Routes

| Method | Route | Auth | Response |
|--------|-------|------|----------|
| GET | `/milestones` | Yes | `{ milestones: [{ ...milestone, unlocked: bool, unlocked_at: string\|null }], unlockedCount }` |

Milestone unlock state is **evaluated live** on every call — `milestoneEngine.js` fetches fresh financial data and checks each threshold. The `unlocked_at` timestamp is preserved from `user_milestones` (only the first-ever unlock time is stored).

### AI and Roadmap Routes

| Method | Route | Auth | Params | Response |
|--------|-------|------|--------|----------|
| GET | `/roadmap` | Yes | — | `{ task, explanation, source: 'cache'\|'groq'\|'fallback'\|'error' }` |
| GET | `/allocation-insights` | Yes | `?level=N&risk=low\|medium\|high&gaps=[JSON]` | `{ insight: string\|null }` |

**`/roadmap`** runs the full AI coaching pipeline (see [AI Coaching Pipeline](#ai-coaching-pipeline)).

**`/allocation-insights`** calls Groq with the user's actual vs. suggested allocation gap data. The first line of the response is always `"Alignment Score: N%"` computed as `max(0, 100 − totalAbsGap / 2)`.

### Learning Routes

**Important:** `/learning/recent` must be registered before `/learning/:level` in `server.js`. Express routes match top-down; if `:level` is first, the string `"recent"` is treated as a level parameter.

| Method | Route | Auth | Response |
|--------|-------|------|----------|
| GET | `/learning/recent` | Yes | `{ recent: [{ level, levelName, topicOrder, topicName, status, lastViewedAt }] }` — up to 3 most recently viewed |
| GET | `/learning/:level` | Yes | `{ level, levelName, topics: [{ topicOrder, topicName, status, lastViewedAt, completedAt, subConcepts: [{ subConceptOrder, subConceptName, explanation, checkQuestion, checkAnswer }] }], summary: { totalTopics, topicsCompleted, topicsRemaining } }` |
| POST | `/learning/progress` | Yes | `{ level, topicOrder, status }` | `{ progress }` — upserts the progress row |

### Utility Routes

| Method | Route | Auth | Response |
|--------|-------|------|----------|
| GET | `/` | No | `{ status: "ok", message }` |
| GET | `/health` | No | `{ status: "ok", supabase: "connected" }` or 500 |
| GET | `/recommendations` | No | `?level=1-8&goal=wealth` → `{ recommendation: { headline, summary, steps, products, milestone, warning } }` |
| POST | `/contact` | No | `{ name, email, message }` → `{ success: true }` or 503 if Resend not configured |

---

## Key Data Flows

### 1. Onboarding and Score Calculation

```
User fills steps 1–4 in browser
→ step4/page.tsx runs calculateVALAM() from frontend/lib/valam.ts (pure function, no network)
→ scores computed: positionScore, potentialScore, all component scores
→ POST /profile/save-assessment { ...assessment, valamScore, valamLevel, ... }
→ backend validates and upserts profiles row via service role key
→ redirect to /result (score reveal) then to /dashboard
```

### 2. Dashboard Load

```
dashboard/page.tsx mounts
→ GET /profile (with Bearer token)
  → backend fetches profiles row
  → fetches FY investments + income to compute live savings rate
  → fetches networth_items to compute actual net worth
  → runs calculateVALAM() with live data
  → applies dual-score ratchet (update DB if promoted)
  → returns { profile, calculatedScore, currentScore, investments, networthItems, incomeEntries, ... }
→ GET /roadmap (parallel)
  → roadmapEngine picks highest-impact task
  → aiCoach calls Groq OR returns cached explanation
  → returns { task, explanation, source }
→ GET /learning/recent (parallel)
  → returns up to 3 recently viewed topics
→ Dashboard renders: hero with dual scores, AI task card, learning progress card
```

### 3. Investment Add → Score Update

```
User adds investment on /portfolio
→ POST /investments { type, amount, date?, mfType? }
→ server validates type + mfType
→ inserts into investments table (with mf_type if applicable)
→ Next visit to /dashboard:
  → GET /profile recomputes positionScore with updated FY investment data
  → ratchet promotes if new score > stored current_score
```

### 4. SIP Execution (Automated)

```
server.js startup:
→ executeDueSIPs(supabaseAdmin) runs immediately
→ setInterval repeats every 24 hours

sipCron.js logic:
→ SELECT from sip_plans WHERE status='active' AND next_execution_date <= today
→ For each due SIP:
  → INSERT into investments (user_id, date=today, type, amount, note='[SIP] ...')
  → advance next_execution_date by 1 month (preserving start day) or 7 days for weekly
  → UPDATE sip_plans SET next_execution_date=... WHERE id=...
```

### 5. Learning Progress

```
User visits /learning/[level]/[topicOrder]
→ GET /learning/:level → loads all topics + subconcepts for that level
→ User reads through concept slides (stored locally in component state)
→ On each "Next" click: POST /learning/progress { level, topicOrder, status: 'continue' }
→ On final slide "Complete Topic": POST /learning/progress { status: 'completed' }
  → backend upserts learning_progress, sets completed_at if first completion
→ On /learning/recent: returns this topic as most-recently-viewed
```

### 6. Allocation Insights (AI)

```
User visits /allocation
→ GET /profile → fetches investments to build actual allocation %
→ frontend computes gap vs. suggested allocation (from frontend/lib/allocation.ts)
→ User selects risk level (low/medium/high)
→ GET /allocation-insights?level=N&risk=...&gaps=[JSON]
  → backend builds Groq prompt with user age, level, risk label, gap data
  → Groq returns plain-text insight starting with "Alignment Score: N%"
  → displayed below the donut charts
```

---

## Feature Descriptions

### Learning Hub (`/learning/[level]`)

Covers six levels (2–7). Level 1 (Seed) has no structured content. Each level contains 8 topics; each topic contains 3–7 sub-concept slides.

The level overview page shows all topics as cards with status badges (Not Started / In Progress / Completed). A level-switcher pill row at the top lets users jump between levels; locked levels (user's level + 2 and above) show as dimmed and non-clickable.

### Lesson Detail (`/learning/[level]/[topicOrder]`)

Presents sub-concept slides one at a time. Each slide shows the concept name, explanation body, and a self-check question. A "Show Answer" button reveals the answer. Navigating through all slides enables the "Complete Topic" button. Progress is persisted with `POST /learning/progress` after each navigation event.

### Portfolio Tracker (`/portfolio`)

Logs investments by type. When `type = 'mf'`, users can optionally select a sub-category (`mf_type`) from: largecap, midcap, smallcap, nifty50, flexicap, international, debt, commodity. Entries linked to an active SIP display a `[SIP]` badge. A `MiniChart` SVG renders a cumulative trend line for two or more dated entries. Each row has Dup (pre-fills the form) and Del (delete with confirmation) action buttons.

### SIP Manager (`/sip`)

Lets users create recurring investment schedules. Monthly SIPs preserve the calendar day of the start date across months (clamped to month-end for short months). A SIP can be paused (stops execution, resumes from current `next_execution_date`) or cancelled (permanent). History view shows all auto-logged investment entries for a given SIP.

### Asset Allocation (`/allocation`)

Compares actual investment allocation against VALAM-suggested allocation. Uses two donut charts (actual vs. suggested). Suggested allocation is computed by `getSuggestedAllocation(age, risk)` from `frontend/lib/allocation.ts`:

- `low` risk + age<40 → 70% Equity / 20% Debt / 10% Commodity
- `medium` risk + age<40 → 80% Equity / 10% Debt / 10% Commodity
- `high` risk + age<40 → 90% Equity / 0% Debt / 10% Commodity
- Age bands: <40, 40–59, 60+

The `GET /allocation-insights` Groq call provides a short plain-text commentary starting with the alignment score.

### Milestones (`/milestones`)

80 achievements across four categories: Net Worth, Portfolio (total investments), Income (FY), and Savings Rate. Checked server-side on every `GET /milestones` call via `milestoneEngine.js`. The `unlocked_at` timestamp is recorded the first time a threshold is met and never overwritten. The milestones page renders badges in a responsive grid; clicking expands inline to show the threshold, description, and unlock date.

### Net Worth Calculator (`/networth`)

Tracks assets and liabilities with free-text labels and ₹ amounts. The backend computes actual net worth from these items and feeds it into the positionScore formula on every `GET /profile` call. The page shows total assets, total liabilities, and net worth at the top with a balance indicator.

### Income and Savings (`/income`)

Records income entries with required date (used for Indian FY calculations). `getFinancialYearStart()` returns April 1 of the current or previous year depending on the current month. The page computes:
- **FY savings rate**: (total FY investments ÷ total FY income) × 100
- **Monthly savings rate**: (this-month investments ÷ this-month income) × 100

Both figures are also included in the `GET /profile` response for dashboard display.

---

## Auth Flow

### Email / Password

```
1. User submits email + password on /login
2. Frontend calls supabase.auth.signInWithPassword() (no backend involved)
3. Supabase JS client stores session in localStorage automatically
4. Every backend call sends Authorization: Bearer <access_token>
5. requireUser middleware calls supabase.auth.getUser(token) (5-second timeout)
6. req.user = { id, email, ... } attached to the request
7. After login, redirect to /  — landing page checks session and routes to /dashboard or /onboarding/step1
```

### Google OAuth (PKCE)

```
1. User clicks "Continue with Google" on /login or /signup
2. Frontend calls supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
3. Supabase generates PKCE code verifier, stores in sessionStorage, redirects to Google
4. Google authenticates and redirects to /auth/callback?code=<authorization_code>
5. auth/callback/page.tsx (MUST be a 'use client' page.tsx, not route.ts):
   - Reads code from window.location.search
   - Calls supabase.auth.exchangeCodeForSession(code)
   - The PKCE verifier is in browser sessionStorage — a Next.js route.ts server handler
     cannot access sessionStorage, so PKCE verification would always fail with route.ts
6. On successful session exchange, the callback checks for a profiles row:
   - Row exists → redirect to /dashboard
   - No row + localStorage.pendingAssessment exists → POST /profile/save-assessment then redirect to /
   - No row + no pending assessment → redirect to /onboarding/step1
7. Fallback: if no code in URL (Supabase hash-fragment flow), calls getSession() directly
```

---

## SIP Automation

`backend/lib/sipCron.js` is imported by `server.js` and runs on two triggers:
1. **Startup** — catches any SIPs that were due overnight
2. **Every 24 hours** — via `setInterval`

```js
// server.js startup
executeDueSIPs(supabaseAdmin).catch(console.error);
setInterval(() => executeDueSIPs(supabaseAdmin).catch(console.error), 24 * 60 * 60 * 1000);
```

**Monthly date handling:** SIPs preserve the calendar day of the start date. A monthly SIP started on the 31st will execute on the last day of shorter months (e.g. Feb 28/29, Apr 30). The `advanceSipDate()` function handles this clamping.

**Immediate execution on creation:** If the user sets `start_date` to today or earlier, the SIP executes immediately when `POST /sips` is called, then advances `next_execution_date` to the next future cycle.

---

## AI Coaching Pipeline

`GET /roadmap` runs a two-stage pipeline on each call:

### Stage 1: Deterministic Task Selection (roadmapEngine.js)

No LLM. Pure rule-based logic:

1. Fetch profile, compute fresh factor scores from live data
2. **Financial Health override:** if `financialHealthScore ≤ 3`, Task 1 is always an FH task (build emergency fund / clear debt / get insurance). The specific FH task is selected by whichever sub-factor has the worst gap.
3. **If FH override doesn't apply:** rank factors by `(maxScore − currentScore) × weight`. The factor with the largest weighted gap becomes the priority task.
4. Apply the learning gate: if `experienceScore` is the weakest factor AND user's learning level is below intermediate, keep it as top priority — build knowledge before other habits.
5. Return `{ taskType, title, detail, context: { currentLevel, nextLevel, scoreGaps } }`

### Stage 2: AI Narration (aiCoach.js)

Calls Groq (`llama-3.3-70b-versatile`, max 256 tokens) with:
- The task already decided by Stage 1
- The full `valamContext` object (user profile, financial profile, portfolio profile, learning profile)
- A strict compliance system prompt: no market timing, no named securities or fund houses, no guaranteed/assured returns, no specific % return targets, no indices (Nifty, Sensex) used as investment advice

**Content filtering:** The response is scanned against `BANNED_PATTERNS` regex list. If a banned term is found, the response is discarded and a pre-written fallback from `FALLBACKS[taskType]` is returned instead.

### Caching

The `profiles` table stores 4 cache columns. Before calling Groq, `roadmapCache.js` checks if `cachedRoadmapScoreSnapshot === currentPositionScore`. If it matches, the cached explanation is returned immediately (`source: 'cache'`). On a new score or first call, Groq is called and the result is written to the cache columns.

```
GET /roadmap
→ check cache: if score unchanged → return cached explanation (source: 'cache')
→ else: run roadmapEngine (no LLM) → run aiCoach (Groq call)
→ write explanation + task_type + score_snapshot to profiles cache columns
→ return { task, explanation, source: 'groq' }
```

---

## CSS Variable Design System

Dark mode is implemented via a `body.dark` class toggle — not `prefers-color-scheme` media query. The `ThemeProvider` in `app/context/themecontext.tsx` reads `localStorage.getItem('theme')` on mount and writes `body.dark` class on toggle.

CSS variables are defined in `frontend/app/globals.css`:

| Variable | Light mode | Dark mode | Use for |
|----------|-----------|-----------|---------|
| `--bg` | `#EFEDE8` | `#231512` | Page background |
| `--surface` | `#F5F3EF` | `#2C1A16` | Cards, panels |
| `--surface2` | `#EAE7E1` | `#3A2218` | Input backgrounds, secondary surfaces |
| `--border` | `rgba(180,155,110,0.18)` | `rgba(201,168,76,0.15)` | Subtle borders |
| `--border-md` | `rgba(180,155,110,0.28)` | `rgba(201,168,76,0.28)` | Medium-weight borders |
| `--gold` | `#B8924A` | `#C9A84C` | Primary accent, gold elements |
| `--gold-lt` | `#D4AD72` | `#F0D080` | Lighter gold, gradients |
| `--bronze` | `#8F6828` | `#8B6914` | Tertiary accent |
| `--muted` | `#7A6E5F` | `#B89A72` | Secondary text, labels |
| `--text` | `#1E1C18` | `#F5F0E8` | Primary text |
| `--text-sm` | `#3A3630` | `#D4C4A8` | Secondary body text |
| `--green` | `#4A7A4A` | `#4CAF50` | Positive values, completed states |
| `--red` | `#C0392B` | `#E57373` | Negative values, errors |

**Rule:** Never use hardcoded `rgba(R,G,B,A)` in inline styles for colors that should change in dark mode. Always use a CSS variable. For alpha variants of the gold color, define `--gold-rgb` in both `:root` and `body.dark` then use `rgba(var(--gold-rgb), 0.1)`.

**Pages with their own inline nav** (allocation, milestones, learning hub, lesson detail) use a `<style>` block inside the component that redefines `:root` and `body.dark` — the same values as `globals.css`. These pages are excluded from the global Navbar and Footer via the `appPages` allowlist.

---

## Important Patterns and Gotchas

**Never run `npm install` or `npm run dev` from the repo root.** Each service has its own independent `package.json`. Always `cd frontend/` or `cd backend/` first.

**Navbar and Footer both maintain their own `appPages` array.** When adding a new authenticated route, the path prefix must be added to **both** components or the marketing UI appears on that page. Current app paths that must appear in both: `/dashboard`, `/portfolio`, `/networth`, `/income`, `/result`, `/onboarding`, `/auth`, `/profile`, `/learning`, `/milestones`, `/allocation`, `/sip`.

**No psql in WSL.** There is no local PostgreSQL instance. All schema changes and seed data must be run in Supabase Dashboard → SQL Editor → New query. Migration files in `backend/migrations/` are the source of truth — run them in filename order.

**Express route ordering: `/learning/recent` before `/learning/:level`.** Express matches routes top-to-bottom. If `:level` is registered first, Express treats `"recent"` as a level parameter and the recent-topics endpoint is unreachable.

**Backend port 5000, frontend port 3000.** `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local` must be `http://localhost:5000`. All pages with a fallback URL hardcode `http://localhost:5000`.

**`.env.local` lives inside each service directory, not the repo root.** A `.env.local` at the repo root has no effect.

**`/auth/callback` must be `page.tsx`, not `route.ts`.** The PKCE code verifier is stored in browser sessionStorage. A Next.js server-side `route.ts` handler cannot access sessionStorage; the PKCE exchange always fails with `route.ts`. The callback is a `'use client'` component that reads `window.location.search` and calls `supabase.auth.exchangeCodeForSession()`.

**Dark mode initialisation in pages with custom nav.** On mount, a `useEffect` must read both `document.body.classList.contains('dark')` and `localStorage.getItem('theme') === 'dark'`, then call `setDark(isDark)` and `document.body.classList.toggle('dark', isDark)` unconditionally. Using `if (isDark) { setDark(true) }` breaks light-mode initialisation when navigating from a previously dark page (the class stays on body but the component state is wrong).

**`GET /profile` recalculates the VALAM score on every call.** It does not just return the stored value. It fetches live FY investments and income, computes fresh factor scores, and applies the dual-score ratchet. This means the dashboard always shows up-to-date scores without any manual "recalculate" step.

**Backend uses two Supabase clients with distinct purposes:**
- `supabaseAuth` (anon key) — used only in `requireUser` middleware to validate JWT tokens
- `supabaseAdmin` (service role key) — used for all database reads and writes; bypasses all RLS policies

**SIP `mf_type` vs investments `mf_type` use different value sets.** SIPs use `VALID_MF_TYPES = ['index','flexicap','midcap','largecap','smallcap','elss','hybrid']`. Portfolio investments use `VALID_PORTFOLIO_MF_TYPES = ['largecap','midcap','smallcap','nifty50','flexicap','international','debt','commodity']`. These are intentionally different and must not be merged.

**Resend must be initialized before the backend serves requests.** If `RESEND_API_KEY` is added to `.env.local` after the backend process has already started, the `resend` client variable is `null` and the contact form returns 503. Restart the backend after adding the key.

**Kill stale dev processes when `EADDRINUSE` appears:** `lsof -ti:3000 | xargs kill` or `lsof -ti:5000 | xargs kill`.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `ai-integration` | Current active development — all features are being merged here |
| `integration-dinesh` | Dinesh's UI/UX improvements (CSS variables, login layout, footer fix) |
| `main` | Clean baseline — do not merge without team agreement |

All active development happens on `ai-integration`. When merging from `integration-dinesh`, cherry-pick or selectively apply changes to preserve superior logic in the current branch (e.g., no module-level `await`, correct async patterns in onboarding, navbar with all app routes including `/milestones` and `/sip`).
