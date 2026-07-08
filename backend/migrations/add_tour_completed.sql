-- Migration: add_tour_completed
-- Adds tour_completed to the profiles table.
--
-- tour_completed: true once a user has finished or skipped the dashboard
-- onboarding spotlight tour; used to prevent it from showing again.
--
-- Run manually after reviewing; do NOT apply to production without a backup.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT false;
