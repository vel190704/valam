-- Migration: add_financial_health
-- Adds the three Financial Health input columns and a computed score column
-- to the profiles table.
--
-- Run manually in Supabase Dashboard SQL Editor after reviewing.
-- DO NOT run against production without a backup.
--
-- Column semantics:
--   emergency_fund     TEXT  — 'none' | '1-2months' | '3-6months' | '6months+'
--   high_interest_debt TEXT  — 'none' | 'some' | 'significant'
--   health_insurance   TEXT  — 'yes' | 'no'
--   financial_health_score INTEGER — application-computed on each /profile call
--
-- Default NULL means "not yet answered" (existing users).
-- When any of the three inputs is NULL, the application defaults
-- financial_health_score = 4 (neutral baseline, no penalty).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS emergency_fund          TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS high_interest_debt      TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS health_insurance        TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS financial_health_score  INTEGER DEFAULT NULL;
