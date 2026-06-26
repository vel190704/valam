  # VALAM Audit Report
  Generated: 2026-06-25T04:29:58.869Z
  Branch: ai-integration

  ## Summary
  | Total Tests | Passed | Failed | Partial |
  |-------------|--------|--------|---------|
  | 9    | 4      | 1      | 4       |

  ## Test Results

  ### TEST 1 — Contact Us Form
  Status: **FAIL**

  - POST /contact → HTTP 503
  - Response: {"error":"Email not configured"}
  - RESULT: 503 — Resend email service not configured (RESEND_API_KEY missing/invalid)

  Evidence:
    - test_1_contact_initial.png
    - test_1_contact_filled.png
    - test_1_contact_after_submit.png

  ### TEST 2 — Hero Card Dynamic Values
  Status: **PASS**

  - Sub-tests: 2A=PASS 2B=PASS 2C=PASS
  - Baseline — score: 4.2, badge: Level 8
  - Added item DB id: 111d276c-fce5-417c-916b-90dab741da48
  - After add — score: 7.2
  - 2A PASS — score changed from 4.2 to 7.2
  - Delete DB result: ok
  - After delete — score: 4.2
  - 2B PASS — score returned toward baseline
  - 2C PASS — no hardcoded level name strings found in page source

  Evidence:
    - test_2_hero_before.png
    - test_2a_hero_after_add.png
    - test_2b_hero_after_delete.png

  ### TEST 3 — Net Worth Math Correctness
  Status: **PASS**

  - Sub-tests: 3A=PASS 3B=PASS 3C=PASS 3D=PASS
  - Baseline text excerpts — Assets: "₹5.9L", Liab: "₹1.6L", NW: "Goals"
  - 3A PASS — asset entry visible on page after add
  - 3B PASS — liability entry visible on page after add
  - 3C DB check — assets: ₹6,90,000, liab: ₹2,10,000, expected NW: ₹4,80,000
  - 3C PASS — both test items present in DB, formula: assets(690000) - liab(210000) = NW(480000)
  - 3D PASS — test items removed

  Evidence:
    - test_3_nw_baseline.png
    - test_3a_after_asset.png
    - test_3b_after_liability.png
    - test_3d_after_delete.png

  ### TEST 4 — Dynamic Buttons & Status Indicators
  Status: **PASS**

  - Sub-tests: 4a=PASS 4b=PASS 4c=PASS
  - 4a — scoreStatus from API: "regression"
  - 4a — Promotion pill visible: false
  - 4a — Regression pill visible: true
  - 4a PASS — pill visibility matches scoreStatus from API
  - 4c — Page shows: 49/80 unlocked
  - 4c — API says: 49 unlocked
  - 4c PASS — displayed count matches API count
  - 4b — Learning page has "Completed" badge: true
  - 4b — Learning page has topic content: true
  - 4b PASS — learning page renders topics (status badges present)

  Evidence:
    - test_4a_dashboard.png
    - test_4c_milestones.png
    - test_4b_learning.png

  ### TEST 5 — Milestones Dark/Light Mode
  Status: **PARTIAL**

  - Sub-tests: 5a=PASS 5b=PASS 5c=FAIL 5d=FAIL
  - 5a — Dashboard body.dark after ensuring light: false
  - 5a PASS — dashboard in light mode
  - 5b — Milestones body.dark: false
  - 5b — Milestones background-color: rgb(239, 237, 232)
  - 5b PASS — milestones in light mode when coming from light dashboard
  - 5c — Dashboard dark after toggle: true
  - 5c — Milestones body.dark after dark dashboard: false
  - 5c — Milestones background: rgb(239, 237, 232)
  - 5c FAIL — milestones is still light after dark dashboard toggle
  - 5d — localStorage.theme: "light"
  - 5d — body.dark after reload: false
  - 5d FAIL — localStorage.theme not set to "dark" (dashboard uses local state, not ThemeContext)

  Evidence:
    - test_5a_dashboard_light.png
    - test_5b_milestones_light.png
    - test_5c_milestones_dark.png
    - test_5d_milestones_reload.png

  ### TEST 6 — AI Tasks Personalisation
  Status: **PARTIAL**

  - Sub-tests: 6A=PASS 6B=PASS 6C=FAIL
  - 6A — Profile set to: emergency_fund=none, high_interest_debt=significant
  - 6A — Calling /roadmap (may take up to 20s for Groq)...
  - 6A — Source: llm
  - 6A — Task 1 title: "Build Emergency Fund"
  - 6A — All tasks: Build Emergency Fund | Increase Monthly SIP | Diversify Asset Allocation | Grow Net Worth | Complete Learning Modules
  - 6A PASS — Task 1 correctly prioritises emergency fund
  - 6B — Profile set to: emergency_fund=3-6months, high_interest_debt=none
  - 6B — Calling /roadmap...
  - 6B — Source: llm
  - 6B — Task 1 title: "Build Emergency Fund"
  - 6B — All tasks: Build Emergency Fund | Increase Monthly SIP | Reduce Liability | Complete Learning Module | Diversify Investment Portfolio
  - 6B PASS — no generic fallback text in tasks
  - 6C FAIL — task titles same or missing: A="Build Emergency Fund" B="Build Emergency Fund"
  - 6D — Profile restored to original values

  Evidence:
    - test_6a_profile_a.png
    - test_6b_profile_b.png

  ### TEST 7 — No Hardcoded Values
  Status: **PARTIAL**

  - Sub-tests: 7A=FAIL 7B=PASS 7C=FAIL
  - 7A FAIL — Net Worth card unchanged after adding ₹1L
  - 7B — Add income response: 201
  - 7B PASS — Income & Savings card updated after adding income
  - 7C FAIL — Investments card unchanged after adding ₹10K ETF
  - Items created — nwId: 0729b3df-6362-47b0-8d17-f4811d4cf906, incId: 9ccc1ca7-ee07-499e-9c4c-540ac19d737f, invId: 7b990ae9-59d5-4996-9a29-c7efa1f5e0fe

  Evidence:
    - test_7a_before.png
    - test_7a_after.png
    - test_7b_income.png
    - test_7c_investments.png

  ### TEST 8 — Allocation Level Consistency
  Status: **PARTIAL**

  - Sub-tests: 8A=PASS 8B=FAIL 8C=PASS 8F=FAIL
  - 8A — Dashboard: Level 8 (Seed)
  - 8A — API: calculatedScore=4.2, storedValamLevel=7, liveLevel=4
  - 8A PASS — hero card level found: 8
  - 8B — Allocation page shows: Level 7
  - 8B — Dashboard shows: Level 8
  - 8B FAIL — mismatch: allocation=7, dashboard=8
  - 8C — Medium risk equity/stock %: 35
  - 8C — Conservative risk equity/stock %: 31
  - 8C — Aggressive risk equity/stock %: 38
  - 8C PASS — allocation changes with risk profile: low=31% high=38%
  - 8F — AI insight text: ":root {
      --bg:#EFEDE8; --surface:#F5F3EF; --surface2:#EAE7E1;
      --border:rgba(180,155,110,0.18); --border-md:rgba(180,155,110,0.32);
      --gold:#"
  - 8F FAIL — AI insight found but missing "Alignment Score" prefix

  Evidence:
    - test_8a_dashboard.png
    - test_8b_allocation.png
    - test_8c_conservative.png
    - test_8c_aggressive.png
    - test_8f_allocation_insight.png

  ### PHASE 2 — AI Context Consistency Audit
  Status: **PASS**

  - ── valamContext from /roadmap ──
  - Source: cache
  - Tasks returned: 5
  - Task 1: "Build Emergency Fund"
  - DB networth: ₹4,30,000
  - DB total invested (all-time): ₹6,76,559
  - DB income this FY (from 2026-03-31): ₹16,60,000
  - 
  ── Context Gaps Check ──
  - AI tasks contain ₹ amounts: true
  - NOTE: roadmap response is from cache
  - No critical context gaps found

  Evidence:
    - phase2_context_audit.png


  ## Critical Issues Found



  1. **Dashboard theme toggle does not persist to localStorage** — the dashboard uses a local `dark` state that sets `body.classList` but does not call `localStorage.setItem('theme')`. Fix: connect dashboard theme toggle to ThemeContext.

  - **Contact form returns 503** — RESEND email service not configured. Add valid `RESEND_API_KEY` to `backend/.env.local`.

  ## AI Context Audit Summary

  ── valamContext from /roadmap ──
  Source: cache
  Tasks returned: 5
  Task 1: "Build Emergency Fund"
  DB networth: ₹4,30,000
  DB total invested (all-time): ₹6,76,559
  DB income this FY (from 2026-03-31): ₹16,60,000

  ── Context Gaps Check ──
  AI tasks contain ₹ amounts: true
  NOTE: roadmap response is from cache
  No critical context gaps found

  ## Screenshots Index
  - `phase2_context_audit.png`
  - `test_1_contact_after_submit.png`
  - `test_1_contact_filled.png`
  - `test_1_contact_initial.png`
  - `test_2_hero_before.png`
  - `test_2a_hero_after_add.png`
  - `test_2b_hero_after_delete.png`
  - `test_3_nw_baseline.png`
  - `test_3a_after_asset.png`
  - `test_3b_after_liability.png`
  - `test_3d_after_delete.png`
  - `test_4a_dashboard.png`
  - `test_4b_learning.png`
  - `test_4c_milestones.png`
  - `test_5a_dashboard_light.png`
  - `test_5b_milestones_light.png`
  - `test_5c_milestones_dark.png`
  - `test_5d_milestones_reload.png`
  - `test_6a_profile_a.png`
  - `test_6b_profile_b.png`
  - `test_7a_after.png`
  - `test_7a_before.png`
  - `test_7b_income.png`
  - `test_7c_investments.png`
  - `test_8a_dashboard.png`
  - `test_8b_allocation.png`
  - `test_8c_aggressive.png`
  - `test_8c_conservative.png`
  - `test_8f_allocation_insight.png`

  ---
  All screenshots saved to /test-results/
  Run time: 126.4 seconds
