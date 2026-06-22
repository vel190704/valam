-- Migration: add_dual_scores
-- Adds calculated_score and current_score to the profiles table.
--
-- calculated_score: recomputed fresh on every VALAM run (can go up or down)
-- current_score:    ratchet score — only moves up; never decreases
--
-- Run manually after reviewing; do NOT apply to production without a backup.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS calculated_score NUMERIC(4,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_score    NUMERIC(4,2) DEFAULT NULL;

-- Back-fill current_score from the existing valam_score for all users.
-- After this, the application layer enforces the ratchet going forward.
UPDATE profiles
SET current_score = valam_score
WHERE current_score IS NULL
  AND valam_score IS NOT NULL;
