# VALAM — Wealth Assessment and Level Advancement Model

VALAM is a gamified personal finance platform for Indian retail investors — think Duolingo for investing. Users complete a 4-step assessment, receive a Valam Score (1–8 scale) representing their current wealth position, see a Potential Score showing where they could reach, and get a deterministic AI-coached action plan to level up. The app tracks investments, income, net worth, and learning progress across eight named wealth levels.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend framework | Next.js (App Router) | ^16.2.9 | Pages, routing, SSR/SSG |
| UI library | React | 19.2.4 | Component model |
| Styling | Tailwind CSS + inline CSS vars | 4.x | Design system, dark/light mode |
| Language | TypeScript | ^5 | Type safety across frontend |
| Backend framework | Express | ^5.2.1 | REST API server |
| Backend runtime | Node.js (ESM) | 18+ | Server runtime |
| Database + Auth | Supabase (PostgreSQL + GoTrue) | ^2.x | Storage, RLS, OAuth |
| AI inference | Groq SDK | ^1.2.1 | LLM coaching explanations (llama-3) |
| Algorithm | `frontend/lib/valam.ts` | — | Scoring engine (pure TS, no deps) |

---

## Project Structure

```
valamhq/
├── frontend/                   # Next.js app (port 3000)
│   ├── package.json            # Independent — always cd frontend/ before npm commands
│   ├── app/
│   │   ├── layout.tsx          # Root layout — mounts <Navbar> and <Footer> globally
│   │   ├── page.tsx            # Landing page — hero, CTA, score preview
│   │   ├── login/page.tsx      # Email/password login (Supabase JS client)
│   │   ├── signup/page.tsx     # Email/password sign-up
│   │   ├── auth/callback/page.tsx  # Google OAuth PKCE code exchange (MUST be page.tsx, not route.ts)
│   │   ├── onboarding/
│   │   │   ├── step1/page.tsx  # Age input
│   │   │   ├── step2/page.tsx  # Income bracket
│   │   │   ├── step3/page.tsx  # Savings rate + investment bracket
│   │   │   └── step4/page.tsx  # Experience level → runs valam.ts → posts to /profile/save-assessment
│   │   ├── dashboard/page.tsx  # Main app hub — hero slider, AI task card, learning card, tabs
│   │   ├── result/page.tsx     # Post-onboarding result display
│   │   ├── portfolio/page.tsx  # Investment log with MiniChart and Dup/Del actions
│   │   ├── income/page.tsx     # Income entries by source, savings-rate calculations
│   │   ├── networth/page.tsx   # Asset/liability tracker
│   │   ├── allocation/page.tsx # Actual vs suggested asset allocation with donut charts
│   │   ├── milestones/page.tsx # 80 achievement badges across 4 categories
│   │   ├── learning/
│   │   │   ├── [level]/page.tsx           # Level overview — topic grid, level switcher pills
│   │   │   └── [level]/[topicOrder]/page.tsx  # Lesson slideshow — concept cards, Show answer, Next
│   │   ├── profile/page.tsx    # View/edit profile and scores
│   │   ├── about/page.tsx      # Marketing — about page
│   │   ├── vision/page.tsx     # Marketing — vision page
│   │   └── contact/page.tsx    # Marketing — contact page
│   ├── components/
│   │   └── layout/
│   │       ├── Navbar.tsx      # Marketing nav — hidden on all app routes via appPages allowlist
│   │       └── Footer.tsx      # Marketing footer — same appPages allowlist (MUST match Navbar's)
│   └── lib/
│       ├── valam.ts            # Scoring algorithm — positionScore, potentialScore, level mapping
│       ├── supabase.ts         # Supabase browser client (anon key)
│       └── allocation.ts       # getAllocation(level) — suggested allocation by level
│
├── backend/                    # Express API server (port 5000)
│   ├── package.json            # Independent — always cd backend/ before npm commands
│   ├── server.js               # All routes, middleware, and startup
│   └── lib/
│       ├── roadmapEngine.js    # Steps 1–7: deterministic task selection (no LLM, pure logic)
│       ├── aiCoach.js          # Step 8: Groq call — narrates the task decided by roadmapEngine
│       ├── roadmapCache.js     # Score-keyed cache — skips Groq when valamScore unchanged
│       ├── milestoneEngine.js  # Checks and unlocks milestones after each data mutation
│       ├── savingsRate.js      # FY and monthly savings-rate calculations
│       └── financialYear.js    # FY boundary helpers (April 1 – March 31 for India)
│
├── backend/migrations/         # SQL to be run manually in Supabase Dashboard SQL Editor
│   ├── add_learning_hub.sql            # Creates learning_content and learning_progress tables
│   ├── seed_learning_content.sql       # Inserts 154 rows across 6 levels (run after above)
│   ├── add_roadmap_cache.sql           # Adds 4 cache columns to profiles
│   ├── income_rename_category_to_source.sql  # Renames income_entries.category → source
│   └── investments_date_optional.sql   # Makes investments.date nullable
│
├── docs/
│   └── FINANCIAL_HEALTH_PROPOSAL.md   # Design proposal — Financial Health factor (not yet implemented)
│
├── .gitignore                  # Covers node_modules, .next, .env*, *.tsbuildinfo, verification_screenshots
├── AGENTS.md                   # Claude Code / agent instructions
├── CLAUDE.md                   # Points to AGENTS.md
└── README.md                   # This file
```

---

## How to Run Locally

**Prerequisites:** Node.js 18+, npm. No PostgreSQL needed — the database is Supabase (cloud).

### Terminal 1 — Backend

```bash
cd backend
npm install
# Create backend/.env.local with variables from the Environment Variables section below
node server.js
# Server running on http://localhost:5000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
# Create frontend/.env.local with variables from the Environment Variables section below
npm run dev
# App running on http://localhost:3000
```

Open http://localhost:3000. The landing page loads immediately without auth.

### Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `EADDRINUSE :5000` | Previous backend process still running | `lsof -ti:5000 \| xargs kill` |
| `EADDRINUSE :3000` | Previous Next.js process still running | `lsof -ti:3000 \| xargs kill` |
| `Cannot find module 'groq-sdk'` | Ran `npm install` at repo root instead of inside `backend/` | `cd backend && npm install` |
| Turbopack crash on startup | Unstable in this Next.js version | `npm run dev` already uses standard webpack — do not add `--turbo` |
| `psql: command not found` in WSL | psql not installed | Don't use psql — run all SQL in Supabase Dashboard SQL Editor |
| `Invalid API key` from Groq | Wrong or missing `GROQ_API_KEY` in `backend/.env.local` | Verify key at console.groq.com |
| Dashboard shows "Loading…" forever | Backend not running or wrong `NEXT_PUBLIC_BACKEND_URL` port | Confirm backend is on 5000 and `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000` |

---

## Environment Variables

### `frontend/.env.local`

| Variable | What it is | Where to get it |
|----------|-----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | Same as above |
| `NEXT_PUBLIC_BACKEND_URL` | Base URL of the Express backend | `http://localhost:5000` for local dev |

### `backend/.env.local`

| Variable | What it is | Where to get it |
|----------|-----------|----------------|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon key (used for auth operations) | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — bypasses RLS for admin writes | Supabase Dashboard → Project Settings → API → service_role |
| `GROQ_API_KEY` | Groq API key for LLM inference | console.groq.com → API Keys |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:3000` for local dev |

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` has full database access. Never expose it to the browser. It must only ever live in the backend environment.

---

## Database Schema

All tables live in Supabase (PostgreSQL). The backend uses the service role key for all writes, bypassing RLS. The frontend Supabase client (anon key) only reads directly during the OAuth callback flow.

### `profiles`
Stores each user's VALAM assessment results and computed scores.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | FK → `auth.users.id`, unique |
| `name` | text | Yes | Display name |
| `age` | integer | Yes | |
| `income` | text | Yes | Bracket key e.g. `'8L-12L'` |
| `savings_rate` | text | Yes | Bracket key e.g. `'15-20'` |
| `investments` | text | Yes | Bracket key e.g. `'1L-5L'` |
| `experience` | text | Yes | `'beginner'`\|`'learning'`\|`'intermediate'`\|`'advanced'` |
| `goal` | text | Yes | `'wealth'`\|`'retire'`\|`'education'`\|`'emergency'` |
| `valam_score` | numeric | Yes | Position score (0–8 scale) |
| `valam_level` | integer | Yes | 1–8 |
| `valam_level_name` | text | Yes | e.g. `'Builder'` |
| `potential_score` | numeric | Yes | Future potential score |
| `potential_level` | integer | Yes | 1–8 |
| `potential_level_name` | text | Yes | |
| `wealth_velocity` | numeric | Yes | investments midpoint ÷ age (₹/year) |
| `savings_score` | numeric | Yes | Component score 1–8 |
| `investments_score` | numeric | Yes | Wealth velocity score 1–8 |
| `income_score` | numeric | Yes | Component score 1–8 |
| `experience_score` | numeric | Yes | Component score 1–8 |
| `age_score` | numeric | Yes | Component score 1–8 |
| `onboarded` | boolean | No | False until step4 completes |
| `cached_roadmap_explanation` | text | Yes | Last Groq-generated coaching text |
| `cached_roadmap_task_type` | text | Yes | Task type at time of caching |
| `cached_roadmap_score_snapshot` | numeric | Yes | valamScore when cache was written |
| `cached_roadmap_generated_at` | timestamptz | Yes | Cache write timestamp |

**RLS:** Enabled. Backend bypasses via service role; frontend anon client reads for auth callback only.

### `investments`
Per-user investment log entries.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | FK → `auth.users.id` |
| `date` | date | Yes | Made nullable by `investments_date_optional.sql` |
| `type` | text | No | `'mf'`\|`'stock'`\|`'fd'`\|`'crypto'`\|`'bond'`\|`'etf'`\|`'real_estate'` |
| `amount` | numeric | No | ₹ value |
| `note` | text | Yes | Optional label |

**RLS:** Enabled.

### `income_entries`
Monthly income records by source category.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | FK → `auth.users.id` |
| `date` | date | No | Required — used for FY calculations |
| `source` | text | No | `'salary'`\|`'freelance'`\|`'business'`\|`'rental'`\|`'interest'`\|`'dividend'`\|`'other'` (renamed from `category` by migration) |
| `amount` | numeric | No | ₹ value |
| `note` | text | Yes | |

**RLS:** Enabled.

### `networth_items`
Assets and liabilities snapshot.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | FK → `auth.users.id` |
| `category` | text | No | `'asset'`\|`'liability'` |
| `label` | text | No | Free-text name e.g. `'Home Loan'` |
| `amount` | numeric | No | ₹ value |
| `note` | text | Yes | |

**RLS:** Enabled.

### `learning_content`
Static curriculum — seeded once, never written by users.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | serial | No | Primary key |
| `level` | integer | No | 2–7 (Level 1 Seed has no content yet) |
| `topic_order` | integer | No | 1–N within the level |
| `topic_name` | text | No | e.g. `'Investing Basics'` |
| `sub_concept_order` | integer | No | Slide number within topic |
| `sub_concept_name` | text | No | Slide title |
| `explanation` | text | No | Body text |
| `check_question` | text | No | Self-check question at end of slide |
| `check_answer` | text | No | Answer revealed on button click |

**RLS:** Disabled. Public read. Written only by seed migration.

### `learning_progress`
Per-user topic completion state.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | FK → `auth.users.id` |
| `level` | integer | No | |
| `topic_order` | integer | No | |
| `status` | text | No | `'not_started'`\|`'continue'`\|`'completed'` |
| `last_viewed_at` | timestamptz | Yes | Updated on every visit |
| `completed_at` | timestamptz | Yes | Set when status → `'completed'` |

**RLS:** Enabled.

---

## API Reference

### Backend Express Routes (port 5000)

All authenticated routes require `Authorization: Bearer <supabase_access_token>`.

| Method | Route | Auth | Purpose | Request body / params | Response shape |
|--------|-------|------|---------|----------------------|----------------|
| GET | `/` | No | Health ping | — | `{ message }` |
| GET | `/health` | No | DB connectivity check | — | `{ status, db }` |
| POST | `/auth/signup` | No | Create account + profile | `{ email, password, name, age, assessment? }` | `{ userId, message }` |
| POST | `/auth/login` | No | Email/password login | `{ email, password }` | `{ accessToken, user: { id, email, name, age } }` |
| GET | `/auth/me` | Yes | Verify token, return user | — | `{ user: { id, email, name, age } }` |
| GET | `/profile` | Yes | Full profile + scores | — | `{ profile }` |
| POST | `/profile/ensure` | Yes | Create profile row if missing | `{ name? }` | `{ profile }` |
| POST | `/profile/save-assessment` | Yes | Save onboarding results | `{ name, age, income, savingsRate, investments, experience, valamScore, valamLevel, valamLevelName, … }` | `{ profileId }` |
| GET | `/recommendations` | No | Static level advice | `?level=1-8&goal=wealth` | `{ recommendation }` |
| GET | `/investments` | Yes | List all user investments | — | `{ investments: [] }` |
| POST | `/investments` | Yes | Add investment entry | `{ type, amount, date?, note? }` | `{ investment }` |
| DELETE | `/investments/:id` | Yes | Delete investment | — | `{ success: true }` |
| GET | `/networth` | Yes | List net worth items | — | `{ items: [] }` |
| POST | `/networth` | Yes | Add asset or liability | `{ category, label, amount, note? }` | `{ item }` |
| DELETE | `/networth/:id` | Yes | Delete net worth item | — | `{ success: true }` |
| GET | `/income` | Yes | List income entries + savings metrics | — | `{ entries, savingsRate, monthlySavingsRate }` |
| POST | `/income` | Yes | Add income entry | `{ source, date, amount, note? }` | `{ entry }` |
| DELETE | `/income/:id` | Yes | Delete income entry | — | `{ success: true }` |
| GET | `/milestones` | Yes | All 80 milestones with unlock state | — | `{ milestones: [], unlockedCount }` |
| GET | `/roadmap` | Yes | AI-coached next action (cached) | — | `{ task, explanation, source: 'cache'\|'groq'\|'error' }` |
| GET | `/learning/recent` | Yes | Up to 3 most recently viewed topics | — | `{ recent: [{ level, levelName, topicOrder, topicName, status, lastViewedAt }] }` |
| GET | `/learning/:level` | Yes | All topics + subconcepts for a level | — | `{ level, levelName, topics: [{ topicOrder, topicName, status, subConcepts: [] }] }` |
| POST | `/learning/progress` | Yes | Update topic completion status | `{ level, topicOrder, status }` | `{ progress }` |

### Frontend Next.js API Routes (port 3000/api)

There are currently **no `app/api/` routes**. All data fetching goes to the Express backend on port 5000. The `/auth/callback` handler is a client-side page component, not an API route.

---

## VALAM v3 Algorithm

Implemented in `frontend/lib/valam.ts` and mirrored in `backend/server.js` (`assessmentToProfile`). Scores are continuous values on a 0–8 scale.

### Current Position Score

Measures where a user is *right now* based on wealth-building behaviour.

```
positionScore = 0.50 × wealthVelocityScore
              + 0.25 × savingsScore
              + 0.15 × incomeScore
              + 0.10 × experienceScore
```

| Factor | Weight | Input | Scoring brackets |
|--------|--------|-------|-----------------|
| Wealth Velocity | 50% | investments midpoint ÷ age (₹/year) | <₹1K→1, <₹5K→2, <₹15K→3, <₹50K→4, <₹1L→5, <₹3L→6, <₹10L→7, ≥₹10L→8 |
| Savings Rate | 25% | `savingsRate` bracket | <2%→1, 2-5→2, 5-10→3, 10-15→4, 15-20→5, 20-30→6, 30-40→7, 40+→8 |
| Income | 15% | `income` bracket | <3L→1, 3-5L→2, 5-8L→3, 8-12L→4, 12-20L→5, 20-30L→6, 30-50L→7, 50L+→8 |
| Experience | 10% | `experience` key | beginner→2, learning→4, intermediate→6, advanced→8 |

**Investment bracket midpoints used for wealth velocity:** `<10k`→₹5K, `10k-1L`→₹55K, `1L-5L`→₹3L, `5L-25L`→₹15L, `25L+`→₹30L

### Future Potential Score

Measures where a user *could reach* given time and behaviour change. Excludes wealth velocity (a lagging indicator); adds age premium for remaining time horizon.

```
potentialScore = 0.45 × savingsScore
               + 0.35 × ageScore
               + 0.10 × incomeScore
               + 0.10 × experienceScore
```

| Factor | Weight | Scoring brackets |
|--------|--------|-----------------|
| Savings Rate | 45% | Same as position score |
| Age (time horizon) | 35% | ≤24→8, ≤29→7, ≤34→6, ≤39→5, ≤44→4, ≤49→3, ≤59→2, 60+→1 |
| Income | 10% | Same as position score |
| Experience | 10% | Same as position score |

### Wealth Levels

| Score range | Level | Name |
|-------------|-------|------|
| 0.0 – 1.99 | 1 | Seed |
| 2.0 – 2.99 | 2 | Explorer |
| 3.0 – 3.99 | 3 | Builder |
| 4.0 – 4.99 | 4 | Accelerator |
| 5.0 – 5.99 | 5 | Achiever |
| 6.0 – 6.99 | 6 | Wealth Creator |
| 7.0 – 7.49 | 7 | Wealth Architect |
| 7.5 + | 8 | Legend |

Level 7 has a narrower band (0.5 wide vs. 1.0 for others) — it is the penultimate tier and intentionally harder to transit through.

### Worked Example

**Inputs:** age=22, income=`8L-12L`, savingsRate=`15-20`, investments=`1L-5L`, experience=`beginner`

**Step 1 — Component scores:**

| Factor | Calculation | Score |
|--------|-------------|-------|
| Wealth velocity | midpoint ₹3,00,000 ÷ 22 = ₹13,636/yr → between ₹5K and ₹15K thresholds | 3 |
| Savings rate | `15-20` bracket | 5 |
| Income | `8L-12L` bracket | 4 |
| Experience | `beginner` | 2 |
| Age | 22 ≤ 24 | 8 |

**Step 2 — Position score:**
```
0.50×3 + 0.25×5 + 0.15×4 + 0.10×2
= 1.50 + 1.25 + 0.60 + 0.20
= 3.55  →  Level 3 (Builder)
```

**Step 3 — Potential score:**
```
0.45×5 + 0.35×8 + 0.10×4 + 0.10×2
= 2.25 + 2.80 + 0.40 + 0.20
= 5.65  →  Level 5 (Achiever)
```

**Interpretation:** This user is currently a Builder (3.55) with the foundation to reach Achiever (5.65). Their wealth velocity score of 3 is the biggest drag on their position score — the roadmap engine will prioritise `increase_investment_consistency` as the next task since wealthVelocity has the highest weight (50%) and the largest gap from its maximum.

---

## Key Features

**Learning Hub** covers six levels (2–7) with content seeded across 154 rows. Each level contains multiple topics; each topic contains 3–7 sub-concept slides. The lesson detail page (`/learning/[level]/[topicOrder]`) presents one sub-concept at a time with a self-check question and a hidden "Show answer" reveal. Navigating through all sub-concepts and clicking "Complete Topic" posts a `completed` status to `/learning/progress`. The dashboard learning card shows the three most recently viewed topics, fetched live from `/learning/recent`, with correct empty-state copy for new users.

**AI Coaching** works in two stages. `roadmapEngine.js` runs Steps 1–7: it ranks the four positionScore factors by gap-to-maximum, applies a learning-level gate (if experienceScore is the weakest factor and learningLevel < 3, it remains top priority to build knowledge before other habits), and returns the highest-impact task type with current level progress metrics. `aiCoach.js` runs Step 8: it calls Groq with a strict compliance rulebook — no market timing, no named securities or funds, no guaranteed return language, no specific percentage targets — and generates a short personalised coaching paragraph narrating the task already chosen by the engine. A score-keyed cache in the `profiles` table skips the Groq call entirely when the user's `valamScore` has not changed since the last generation, making the roadmap endpoint fast and cost-free on repeat visits.

**Portfolio Tracker** logs investments by type (Mutual Fund, Stock, FD, Crypto, Bond, ETF, Real Estate). Date is optional — entries without dates display `—`. A `MiniChart` SVG renders a cumulative trend line when there are two or more dated entries. Each row has Dup (duplicate the entry into the form) and Del (delete with confirmation) action buttons. After each mutation the backend fires milestone checks for the investment, savings, and net-worth categories.

**Asset Allocation** (`/allocation`) fetches the user's current investment mix from `/investments` and compares it against a level-appropriate suggested allocation from `frontend/lib/allocation.ts`. The page renders two donut charts (actual vs. suggested) and a gap-analysis table showing over-/under-allocation for each asset class. It uses its own custom inline navbar rather than the global Navbar component.

**Milestones** tracks 80 achievements across four categories: Net Worth, Savings Rate, Investments, and Income. Thresholds are checked server-side in `milestoneEngine.js` after every relevant data mutation. The milestones page displays badges in a responsive grid; clicking a badge expands it inline to show the full description, target threshold, and unlock date.

**Net Worth Calculator** (`/networth`) lets users log assets and liabilities with free-text labels and ₹ amounts. The page shows total assets, total liabilities, and net worth at the top. Each entry has Dup and Del buttons.

**Income and Savings Tracker** (`/income`) records income entries by source category. Date is mandatory — used for Indian financial year (April 1 – March 31) savings rate calculations. The page computes both an FY cumulative savings rate and a current-month rate using `savingsRate.js` and `financialYear.js`. An income trend sparkline and source-breakdown percentage bar help users understand their income composition over time.

---

## Auth Flow

### Email / Password

1. User submits email + password on `/login`.
2. Frontend calls `supabase.auth.signInWithPassword()` directly from the Supabase JS client (no backend involved).
3. Supabase returns a session; the JS client stores it in localStorage automatically.
4. Every backend API call sends `Authorization: Bearer <access_token>`.
5. `requireUser` middleware in `server.js` calls `supabase.auth.getUser(token)` to verify the token and attach `req.user`.
6. After login, the app redirects to `/` (landing). The landing page checks for an existing session and routes to `/dashboard` if the user is onboarded, or `/onboarding/step1` if not.

### Google OAuth (PKCE)

1. User clicks "Continue with Google" on `/login` or `/signup`.
2. Frontend calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`.
3. Supabase generates a PKCE code verifier, stores it in the browser's sessionStorage, and redirects to Google's auth page.
4. Google authenticates and redirects back to `/auth/callback?code=<authorization_code>`.
5. **Critical implementation note:** `/auth/callback/page.tsx` is a `'use client'` component. It reads `window.location.search` to extract the `code` parameter and calls `supabase.auth.exchangeCodeForSession(code)`. This exchange **must happen in a client component** — the PKCE code verifier is in the browser's sessionStorage and is inaccessible to a Next.js server-side `route.ts` handler. Using `route.ts` will always fail the PKCE verification.
6. On successful session exchange, the callback checks if a `profiles` row exists for the user:
   - Profile exists → redirect to `/dashboard`.
   - No profile + `localStorage.pendingAssessment` exists (user completed onboarding before signing in) → POST to `/profile/save-assessment` with the stored assessment, then redirect to `/`.
   - No profile + no pending assessment → redirect to `/onboarding/step1`.
7. If no `code` in the URL (hash-fragment flow where Supabase already exchanged automatically), the callback calls `supabase.auth.getSession()` as a fallback and follows the same profile-check logic.

---

## Important Patterns and Gotchas

- **Never run `npm install` or `npm run dev` from the repo root.** Each service has its own independent `package.json` and `node_modules`. Always `cd frontend/` or `cd backend/` first.

- **Navbar.tsx and Footer.tsx each maintain their own independent `appPages` allowlist.** When adding a new authenticated route, the path must be added to the array in **both** files, or the marketing navigation will appear on that page. Current app routes that must appear in both lists: `/dashboard`, `/portfolio`, `/networth`, `/income`, `/result`, `/onboarding`, `/auth`, `/profile`, `/learning`, `/milestones`, `/allocation`.

- **No psql in WSL.** There is no local PostgreSQL instance. All schema changes and seed data must be executed in the Supabase Dashboard → SQL Editor → New query. Migration files in `backend/migrations/` are the source of truth for schema — run them in filename order.

- **Express route ordering: `/learning/recent` must be registered before `/learning/:level`** in `server.js`. If `:level` is registered first, Express matches the string `"recent"` as a level parameter and the recent-topics endpoint becomes unreachable.

- **Backend port is 5000, frontend port is 3000. Never mix them.** `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local` must point to `http://localhost:5000`. Any page with a hardcoded fallback URL should use `http://localhost:5000`, never `4000` or `3000`.

- **`.env.local` lives inside each service directory, not at the repo root.** `frontend/.env.local` for Next.js public vars; `backend/.env.local` for server secrets. A stray `.env.local` at the repo root has no effect on either service.

- **Kill stale dev server processes** when you see `EADDRINUSE`: `lsof -ti:3000 | xargs kill` or `lsof -ti:5000 | xargs kill`.

- **Pages with their own nav (allocation, milestones, learning hub, lesson detail)** use a custom inline navbar and are hidden from the global Navbar via the appPages allowlist. These pages manage their own dark-mode state: on mount, a `useEffect` reads both `document.body.classList.contains('dark')` and `localStorage.getItem('theme')` === `'dark'`, then calls `setDark(isDark)` and `document.body.classList.toggle('dark', isDark)` — unconditionally, not inside an `if` block. Conditional `if (isDark) { setDark(true) }` breaks light-mode initialisation when navigating from a previously dark page.

- **CSS variable dark mode pattern.** Each page with a dark toggle defines a `<style>` block with `:root` (light-mode values) and `body.dark` (dark-mode overrides). Dark mode activates by toggling `document.body.classList`. Hardcoded `rgba(R,G,B,A)` values in inline styles are invisible to this toggle. Use `var(--gold)`, `var(--bg)`, `var(--surface)`, `var(--surface2)`, `var(--text)`, `var(--muted)`, `var(--border)` throughout. For gold rgba tints, define `--gold-rgb: R,G,B` in both `:root` and `body.dark` and use `rgba(var(--gold-rgb), 0.1)`.

---

## Branch Strategy

| Branch | Owner | Purpose |
|--------|-------|---------|
| `integration-dinesh` | Dinesh + Vel | Current active branch — all feature development |
| `integration-mani` | Manivel | Manivel's independent working branch |
| `main` | — | Clean initial state — no merges without team agreement |

---

## Team

| Person | Role |
|--------|------|
| **Vel (Manivel K)** | Backend integration, algorithm implementation, feature development |
| **Dinesh** | UI design, auth architecture, backend structure, AI coaching rulebook |
| **Jagadeesh** | Learning Hub curriculum content (154 sub-concept rows across 6 levels) |
