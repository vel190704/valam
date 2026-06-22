# Financial Health Factor + Priority Reordering — Proposal

**Status:** Proposal only. No code changes. For Vel + Dinesh alignment before implementation.
**Scope:** `roadmapEngine.js` task priority system, `valam.ts` position scoring formula, new onboarding inputs.

---

## 1. The Problem

Dinesh's rulebook names "Financial Health" as Priority 1 in the Task Priority System, above Savings Rate, Investments, Knowledge, and Income Growth. The rulebook's own canonical example makes this concrete:

> A user aged 30, independent, **no emergency fund**, savings 20%, investments ₹2L —  
> AI should NOT say "Invest more." AI should say "Build emergency fund." Because that's the bottleneck.

The current scoring and task engine cannot produce this outcome for three reasons:

**Gap 1 — Financial Health doesn't exist as a factor.**  
The `roadmapEngine.js` weighted-gap formula has four factors: wealthVelocity, savings, income, experience. There is no emergency-fund signal, no debt signal, no insurance signal anywhere in the data pipeline. The "Build emergency fund" task does not exist in `TASK_MAP`.

**Gap 2 — wealthVelocity (Investments, Priority 3) outweighs savings (Priority 2).**  
Current weights: `wealthVelocity 0.50, savings 0.25` — Investments gets 2× the pull of Savings Rate, directly inverting the rulebook's stated hierarchy.

**Gap 3 — income (Priority 5) outweighs knowledge (Priority 4).**  
Current weights: `income 0.15, experience 0.10` — Income pulls more than Knowledge, again inverted.

---

## 2. What New Data Is Needed

Financial Health cannot be scored without new user inputs. **None of the following are collected anywhere today** (verified against all four onboarding steps and the `profiles` table).

### 2a. Required new questions (new onboarding step or extension of Step 3)

| Question | Answer type | Maps to |
|---|---|---|
| "Do you have a liquid emergency fund? If yes, how many months of expenses does it cover?" | Single-select: None / <1 month / 1–2 months / 3–6 months / 6+ months | `emergency_fund_months` (0, 1, 2, 4, 7 midpoints) |
| "Do you currently carry high-interest debt? (credit card balance carried month-to-month, personal loans above 15% interest)" | Yes / No | `has_high_interest_debt` BOOLEAN |
| "Do you have health insurance? (employer-provided, personal policy, or government scheme)" | Yes / No | `has_health_insurance` BOOLEAN |

A fourth question on life/term insurance (relevant for users with dependents) can be added in a follow-up pass. For the initial implementation these three capture the 80% of the signal.

### 2b. New `profiles` table columns required

```sql
ALTER TABLE profiles
  ADD COLUMN emergency_fund_months  SMALLINT  NOT NULL DEFAULT 0,
  ADD COLUMN has_high_interest_debt BOOLEAN   NOT NULL DEFAULT TRUE,
  ADD COLUMN has_health_insurance   BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN financial_health_score SMALLINT  GENERATED ALWAYS AS (
    /* see scoring formula below */
    CASE
      WHEN emergency_fund_months >= 6 AND NOT has_high_interest_debt AND has_health_insurance THEN 8
      WHEN emergency_fund_months >= 3 AND NOT has_high_interest_debt AND has_health_insurance THEN 6
      WHEN emergency_fund_months >= 3 AND NOT has_high_interest_debt                          THEN 5
      WHEN emergency_fund_months >= 1 AND NOT has_high_interest_debt                          THEN 4
      WHEN emergency_fund_months >= 1                                                          THEN 3
      WHEN NOT has_high_interest_debt                                                          THEN 2
      ELSE 1
    END
  ) STORED;
```

**Backfill / migration impact on existing rows:**  
- `emergency_fund_months DEFAULT 0` → all existing users start with no emergency fund
- `has_high_interest_debt DEFAULT TRUE` → conservative assumption (unknown = assume worst case)
- `has_health_insurance DEFAULT FALSE` → conservative assumption
- `financial_health_score` is a generated column — auto-computed, no backfill script needed
- **This is a non-breaking change** for all existing score calculations if Option A (no-FH interim) is deployed first; it only becomes a scoring input when Option B or C is adopted

### 2c. Onboarding placement

The three questions should go into a **new Step 3b** (between the current "financial details" step and the results step), branded as "Your financial foundations." They are simple yes/no + one multi-choice — estimated 30 seconds to complete.

---

## 3. Financial Health Scoring Formula

The `financial_health_score` (1–8) is a computed column derived from the three inputs above:

| Emergency fund | High-interest debt | Health insurance | Score |
|---|---|---|---|
| 6+ months | No | Yes | 8 |
| 3–6 months | No | Yes | 6 |
| 3–6 months | No | No  | 5 |
| 1–2 months | No | Any | 4 |
| 1–2 months | Yes | Any | 3 |
| None        | No | Any | 2 |
| None        | Yes | Any | 1 |

This aligns with the rulebook's framing: the presence of high-interest debt and absence of an emergency fund are the two strongest signals of financial fragility.

---

## 4. Weight-Reordering Options

All three options use the same test case to show concrete score impact:

**Test case:** Age 22, income 8L–12L (`incomeScore=4`), savings 15–20% (`savingsScore=5`), investments 1L–5L (`wealthVelocityScore=3`, midpoint ₹3L ÷ 22 = 13,636, band score 3), experience beginner (`knowledgeScore=2`)

---

### Option A — Fix inversions only, no Financial Health factor yet

**Purpose:** Interim fix to correct the savings/investment and income/knowledge inversions while Financial Health data collection is built. No schema change required.

| Factor | Old weight | New weight | Rulebook priority |
|---|---|---|---|
| Savings Rate | 0.25 | **0.35** | 2 |
| wealthVelocity | 0.50 | **0.30** | 3 |
| Knowledge | 0.10 | **0.20** | 4 |
| Income | 0.15 | **0.15** | 5 |

*Sum: 1.00. Files changed: `roadmapEngine.js` (4 weight constants), `valam.ts` (4 weight constants in `rawPosition` formula)*

**Test case score:**

```
0.35×5 + 0.30×3 + 0.20×2 + 0.15×4
= 1.75 + 0.90 + 0.40 + 0.60
= 3.65  →  Level 3 (Builder)   [was 3.55, same level]
```

**What changes for the user:** Savings Rate becomes the most important factor — a user who improves savings from 10% to 20% gets more score movement than one who increases investments by a band. Knowledge also becomes meaningfully weighted, so completing learning modules has a clearer score impact.

**Task engine impact:** roadmapEngine.js with Option A weights would now select "Build your savings rate" tasks more frequently for users with low savings even if their wealthVelocity gap is large.

---

### Option B — Full Financial Health integration, balanced weights

**Purpose:** Implements Financial Health as a proper scoring factor alongside all four existing factors. Requires the new onboarding questions and schema migration.

| Factor | Old weight | New weight | Rulebook priority |
|---|---|---|---|
| **Financial Health** | *(missing)* | **0.25** | 1 |
| Savings Rate | 0.25 | **0.28** | 2 |
| wealthVelocity | 0.50 | **0.25** | 3 |
| Knowledge | 0.10 | **0.13** | 4 |
| Income | 0.15 | **0.09** | 5 |

*Sum: 1.00. Files changed: `roadmapEngine.js` (new factor + weights), `valam.ts` (new factor in formula), `profiles` schema, onboarding.*

**Test case — no foundations (fhScore=1, no EF, has debt, no insurance):**
```
0.25×1 + 0.28×5 + 0.25×3 + 0.13×2 + 0.09×4
= 0.25 + 1.40 + 0.75 + 0.26 + 0.36
= 3.02  →  Level 3 (Builder)   [was 3.55 — drops]
```

**Same user with solid foundations (fhScore=6, 3-month EF, health insurance, no debt):**
```
0.25×6 + 0.28×5 + 0.25×3 + 0.13×2 + 0.09×4
= 1.50 + 1.40 + 0.75 + 0.26 + 0.36
= 4.27  →  Level 4 (Accelerator)   [was 3.55 — significant jump]
```

**What changes for users:** Building an emergency fund and getting health insurance becomes a direct path to a level-up. A user with identical income/investments/savings but solid financial foundations ranks higher — exactly what the rulebook mandates.

**Task engine impact:** A new `financialHealth` entry in `TASK_MAP` can route users without EF or insurance to a "Build your emergency fund" or "Get health insurance" task before investment tasks are even surfaced. This directly implements the rulebook's canonical bottleneck example.

---

### Option C — Strong Financial Health emphasis

**Purpose:** Most aggressive alignment with the rulebook's "The Most Important Rule." Financial Health carries the most weight, treating it as truly Priority 1 rather than just one of five factors.

| Factor | Old weight | New weight | Rulebook priority |
|---|---|---|---|
| **Financial Health** | *(missing)* | **0.30** | 1 |
| Savings Rate | 0.25 | **0.28** | 2 |
| wealthVelocity | 0.50 | **0.22** | 3 |
| Knowledge | 0.10 | **0.12** | 4 |
| Income | 0.15 | **0.08** | 5 |

*Sum: 1.00. Same file changes as Option B.*

**Test case — no foundations (fhScore=1):**
```
0.30×1 + 0.28×5 + 0.22×3 + 0.12×2 + 0.08×4
= 0.30 + 1.40 + 0.66 + 0.24 + 0.32
= 2.92  →  Level 2 (Explorer)   [drops a full level]
```

**Same user with solid foundations (fhScore=6):**
```
0.30×6 + 0.28×5 + 0.22×3 + 0.12×2 + 0.08×4
= 1.80 + 1.40 + 0.66 + 0.24 + 0.32
= 4.42  →  Level 4 (Accelerator)   [1.5-level swing]
```

**Trade-off:** Option C maximises rule fidelity, but the 1.5-level swing for financial-health status may feel punishing to existing users (a person who's already been at Level 3 drops to Level 2 when FH data is collected and they have no emergency fund). Consider whether to announce this as a "score recalibration" with user communication, or to soften it with Option B's less extreme swing.

---

## 5. Recommended Implementation Order

1. **Now (zero schema risk):** Deploy Option A weights — fixes both inversions without any new schema or onboarding changes. One-line change each in `roadmapEngine.js` and `valam.ts`.

2. **Next sprint:** Build the 3-question Financial Health onboarding step. Add the three `profiles` columns. Define `TASK_MAP.financialHealth` in `roadmapEngine.js` (task: "Build your emergency fund" or "Get health insurance coverage"). Run the migration with `DEFAULT` backfills.

3. **After data collection:** Choose Option B or C weights and deploy the full scoring formula update to both `valam.ts` and `roadmapEngine.js`.

---

## 6. Migration Implications

| Column | Type | Default | Breaking? |
|---|---|---|---|
| `emergency_fund_months` | `SMALLINT NOT NULL` | `0` | No — existing rows get 0 (no EF assumed) |
| `has_high_interest_debt` | `BOOLEAN NOT NULL` | `TRUE` | No — conservative default (assumed worst case) |
| `has_health_insurance` | `BOOLEAN NOT NULL` | `FALSE` | No — conservative default |
| `financial_health_score` | `SMALLINT GENERATED` | computed | No — auto-computed from above three columns |

**Score recalibration risk:** When Option B or C is deployed, existing users' `valam_score` changes because the formula weights change. Users cannot lose their earned level if we add a guard: `new_score = max(new_formula_score, old_score × 0.90)` for a one-time migration, preventing more than a 10% drop. This is a product/UX decision, not a schema decision.

**Existing cache invalidation:** All rows currently have `cached_roadmap_score_snapshot` matching their current `valam_score`. When weights change, `valam_score` changes → snapshots all become stale → all cache entries expire naturally on next dashboard load. No manual cache purge needed.

---

## 7. Tied Item: `aiCoach.js` Signature Change

The audit (Phase 4 of this session's work) identified that `generateCoachingExplanation(groqClient, roadmapResult, userFirstName)` does not receive the user's actual factor scores or learning level. This means the LLM cannot write "Increasing your savings rate from 10% to 20%..." style personalized explanations.

Once Option B/C is implemented and `financialHealth` becomes a real factor:
- `roadmapResult` returned by `determineNextTask()` should include: `factorScores` (the raw numeric scores per factor) and `weakestFactorScore` (so the LLM knows both what the task is AND how bad the gap is)
- `generateCoachingExplanation` should accept `learningLevel` as a 4th parameter, enabling the graduated Level 1–5 knowledge-gating that is currently a binary on/off

These signature changes should be scoped as part of the same sprint as Option B, not before.

---

*Generated from the VALAM_LLM_Document.docx rulebook and live codebase audit — 2026-06-21.*  
*Decision required: Option A weight fix (immediate, safe) and Option B vs C selection for full FH integration.*