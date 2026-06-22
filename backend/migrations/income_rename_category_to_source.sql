-- Phase 2a: income_entries schema change
-- 1. Drop the free-text "source" description column (was "e.g. TCS Salary")
-- 2. Rename "category" (salary/freelance/business/…) to "source"
--
-- Run manually in Supabase SQL editor after reviewing.
-- Safe to run on live data: only renames/drops columns, no row transforms needed.

ALTER TABLE income_entries DROP COLUMN source;
ALTER TABLE income_entries RENAME COLUMN category TO source;
