-- Migration: add roadmap explanation cache columns to profiles table
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- These four columns let the GET /roadmap route skip a Groq API call
-- when the user's valamScore hasn't changed since the last generation.
-- cached_roadmap_score_snapshot is compared (exact match) to the live
-- valamScore on every request — mismatch triggers a fresh LLM call.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cached_roadmap_explanation    TEXT,
  ADD COLUMN IF NOT EXISTS cached_roadmap_task_type      TEXT,
  ADD COLUMN IF NOT EXISTS cached_roadmap_score_snapshot NUMERIC,
  ADD COLUMN IF NOT EXISTS cached_roadmap_generated_at   TIMESTAMPTZ;
