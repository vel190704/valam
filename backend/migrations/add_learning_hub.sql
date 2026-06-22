-- Migration: Learning Hub tables
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Run add_learning_hub.sql FIRST, then seed_learning_content.sql

CREATE TABLE IF NOT EXISTS learning_content (
  id                SERIAL PRIMARY KEY,
  level             INTEGER NOT NULL,          -- 2 through 7 for now
  topic_order       INTEGER NOT NULL,          -- 1-8, order within the level
  topic_name        TEXT    NOT NULL,
  sub_concept_order INTEGER NOT NULL,          -- order within the topic
  sub_concept_name  TEXT    NOT NULL,
  explanation       TEXT    NOT NULL,
  check_question    TEXT    NOT NULL,
  check_answer      TEXT    NOT NULL,
  UNIQUE(level, topic_order, sub_concept_order)
);

-- No RLS on learning_content — shared static content, readable by everyone
-- Written only by admin/seed scripts

CREATE TABLE IF NOT EXISTS learning_progress (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level          INTEGER NOT NULL,
  topic_order    INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'not_started'
                   CHECK (status IN ('not_started', 'continue', 'completed')),
  last_viewed_at TIMESTAMPTZ DEFAULT now(),
  completed_at   TIMESTAMPTZ,
  UNIQUE(user_id, level, topic_order)
);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_progress" ON learning_progress
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for the GET /learning/recent route (latest viewed per user)
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_viewed
  ON learning_progress(user_id, last_viewed_at DESC);
