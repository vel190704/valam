# VALAM — Wealth Assessment and Level Advancement Model

> "Duolingo for Investing" — a gamified personal finance platform for Indian retail investors.

## Overview

VALAM classifies users into 8 progressive wealth levels (Seed → Legend) and delivers personalised financial roadmaps based on their actual financial behaviour — not just wealth. It combines a proprietary dual-scoring algorithm, AI-powered coaching, and structured financial education.

**Legal:** VALAM is not a SEBI-registered Investment Adviser. All content is for educational purposes only.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| Styling | Tailwind CSS v4 + CSS variables (light/dark mode) |
| Backend | Express.js 5 (ESM, port 5000) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password + Google OAuth PKCE) |
| AI | Groq (llama-3.3-70b-versatile) |
| Theme | ThemeContext (light/dark, persisted to localStorage) |

---

## Project Structure

```
valamhq/
├── frontend/                    ← Next.js app (run from here)
│   ├── app/
│   │   ├── page.tsx             ← Landing page
│   │   ├── onboarding/          ← 4-step assessment flow
│   │   ├── result/              ← Dual-score display
│   │   ├── dashboard/           ← Main dashboard
│   │   ├── portfolio/           ← Investment tracker
│   │   ├── networth/            ← Net worth calculator
│   │   ├── income/              ← Income & savings tracker
│   │   ├── allocation/          ← Asset allocation + AI insights
│   │   ├── learning/            ← Learning hub (all levels)
│   │   ├── calculators/         ← 5 financial calculators
│   │   ├── knowledge-hub/       ← 40+ financial concepts
│   │   └── milestones/          ← Achievement tracker
│   ├── components/
│   │   ├── layout/              ← Navbar, DNavbar, Footer
│   │   └── ui/                  ← Disclaimer (reusable)
│   └── lib/
│       ├── valam.ts             ← VALAM v3 scoring algorithm (canonical)
│       ├── allocation.ts        ← Allocation suggestion engine
│       └── supabase.ts          ← Supabase client
├── backend/
│   ├── server.js                ← Express API (all routes)
│   └── lib/
│       ├── valam.js             ← VALAM algorithm (JS mirror of valam.ts)
│       ├── roadmapEngine.js     ← 7-priority task engine
│       ├── aiCoach.js           ← Groq coaching explanation
│       ├── milestoneEngine.js   ← Achievement unlock engine
│       ├── roadmapCache.js      ← Composite cache (score+investments+savings)
│       ├── sipCron.js           ← SIP auto-execution engine
│       ├── savingsRate.js       ← FY + monthly savings rate calculators
│       └── financialYear.js     ← Financial year date utilities
└── migrations/                  ← Supabase SQL migrations (run in order)
```

---

## Running Locally

```bash
# Terminal 1 — Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000

# Terminal 2 — Backend
cd backend
npm install
npm run dev
# → http://localhost:5000
```

**Environment variables:**

`frontend/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

`backend/.env`
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_key
RESEND_API_KEY=your_resend_key
PORT=5000
```

---

## VALAM v3 Algorithm

Two independent scores, both on a 1.0–8.0 scale:

**Current Position Score**
```
Position = 0.28×NetWorthScore + 0.32×InvestmentVelocity
         + 0.20×SavingsRate + 0.10×Income + 0.10×Knowledge
```

**Future Potential Score**
```
Potential = 0.45×SavingsRate + 0.35×AgeScore
          + 0.10×Income + 0.10×Knowledge
```

**Wealth Levels**
| Score | Level | Name |
|---|---|---|
| 1.00–1.99 | 1 | Seed |
| 2.00–2.99 | 2 | Explorer |
| 3.00–3.99 | 3 | Builder |
| 4.00–4.99 | 4 | Accelerator |
| 5.00–5.99 | 5 | Achiever |
| 6.00–6.99 | 6 | Wealth Creator |
| 7.00–7.49 | 7 | Wealth Architect |
| 7.50–8.00 | 8 | Legend |

---

## Database Migrations

Run in this order in Supabase SQL Editor:

```
1. add_learning_hub.sql
2. add_dual_scores.sql
3. add_financial_health.sql
4. add_roadmap_cache.sql
5. add_vehicle_loan_category.sql
6. income_rename_category_to_source.sql
7. investments_date_optional.sql
8. seed_learning_content.sql
```

---

## Key Architecture Decisions

- **Dual-score ratchet:** `currentScore` never decreases — rewards past performance
- **Composite cache key:** `positionScore|totalInvested|savingsRate` — busts when any factor changes
- **Live level:** All pages derive level from `Math.floor(calculatedScore)`, never from stored `valam_level`
- **7-priority task engine:** P1 Emergency → P2 Investing → P3 Savings → P4 Knowledge → P5 Diversification → P6 Net Worth → P7 Level
- **AI coaching:** Groq receives full live context (income, NW, savings rate, SIP status, goal, emergency months)
- **Protected files:** `valam.ts`, `allocation.ts`, `milestoneEngine.js`, `roadmapCache.js` — do not modify without team review

---

## Active Branch

`finalai` — integration of Dinesh's architecture + Vel's AI features

---

## Legal

VALAM is not a SEBI-registered Investment Adviser under the SEBI (Investment Advisers) Regulations, 2013. All content is for educational purposes only.
