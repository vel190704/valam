-- Phase 2b: allow investments without a date
-- Run manually in Supabase SQL editor after reviewing.
ALTER TABLE investments ALTER COLUMN date DROP NOT NULL;
