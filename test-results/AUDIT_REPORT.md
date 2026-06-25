# VALAM Audit Report
Generated: 2026-06-25T07:55:14.337Z
Branch: ai-integration

## Summary
| Total Tests | Passed | Failed | Partial |
|-------------|--------|--------|---------|
| 3    | 2      | 1      | 0       |

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
Status: NOT RUN

### TEST 3 — Net Worth Math Correctness
Status: NOT RUN

### TEST 4 — Dynamic Buttons & Status Indicators
Status: NOT RUN

### TEST 5 — Milestones Dark/Light Mode
Status: **PASS**

- Sub-tests: 5a=PASS 5b=PASS 5c=PASS 5d=PASS
- 5a — Dashboard body.dark after ensuring light: false
- 5a PASS — dashboard in light mode
- 5b — Milestones body.dark: false
- 5b — Milestones background-color: rgb(239, 237, 232)
- 5b PASS — milestones in light mode when coming from light dashboard
- 5c — Dashboard dark after toggle: true
- 5c — Milestones body.dark after dark dashboard: true
- 5c — Milestones background: rgb(26, 15, 10)
- 5c PASS — milestones is dark after dark dashboard
- 5d — localStorage.theme: "dark"
- 5d — body.dark after reload: true
- 5d PASS — theme persists across reload via localStorage

Evidence:
  - test_5a_dashboard_light.png
  - test_5b_milestones_light.png
  - test_5c_milestones_dark.png
  - test_5d_milestones_reload.png

### TEST 6 — AI Tasks Personalisation
Status: NOT RUN

### TEST 7 — No Hardcoded Values
Status: NOT RUN

### TEST 8 — Allocation Level Consistency
Status: **PASS**

- Sub-tests: 8A=PASS 8B=PASS 8C=PASS 8F=PASS
- 8A — Dashboard: Level 4 (Accelerator)
- 8A — API: calculatedScore=4.2, storedValamLevel=7, liveLevel=4
- 8A PASS — hero card level found: 4
- 8B — Allocation page shows: Level 4
- 8B — Dashboard shows: Level 4
- 8B — API liveLevel: 4
- 8B PASS — allocation level matches dashboard level (4)
- 8C — Medium risk equity/stock %: 20
- 8C — Conservative risk equity/stock %: 8
- 8C — Aggressive risk equity/stock %: 37
- 8C PASS — allocation changes with risk profile: low=8% high=37%
- 8F — AI insight text: "Alignment Score: 70%
The largest gaps in the user's portfolio are the under-allocation to FDs and the complete lack of an emergency fund, indicating a"
- 8F PASS — AI insights start with "Alignment Score: X%"

Evidence:
  - test_8a_dashboard.png
  - test_8b_allocation.png
  - test_8c_conservative.png
  - test_8c_aggressive.png
  - test_8f_allocation_insight.png

### PHASE 2 — AI Context Consistency Audit
Status: NOT RUN


## Critical Issues Found





- **Contact form returns 503** — RESEND email service not configured. Add valid `RESEND_API_KEY` to `backend/.env.local`.

## AI Context Audit Summary

Not run

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
Run time: 35.1 seconds
