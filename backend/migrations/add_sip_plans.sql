-- ── SIP Plans ─────────────────────────────────────────────────────────────────
-- Systematic Investment Plans: scheduled recurring investment entries.
-- Each active SIP is executed daily by sipCron.js, which inserts an investment
-- row and advances next_execution_date to the next cycle.

CREATE TABLE sip_plans (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_type       text        NOT NULL
    CHECK (investment_type IN ('mf','stock','fd','crypto','bond','etf')),
  mf_type               text
    CHECK (mf_type IN ('index','flexicap','midcap','largecap','smallcap','elss','hybrid')),
  amount                decimal(14,2) NOT NULL CHECK (amount > 0),
  frequency             text        NOT NULL
    CHECK (frequency IN ('monthly','weekly')),
  start_date            date        NOT NULL,
  next_execution_date   date        NOT NULL,
  status                text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','cancelled')),
  note                  text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE sip_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_sips" ON sip_plans
  USING (auth.uid() = user_id);

-- Link each auto-logged investment back to the SIP that created it
ALTER TABLE investments
  ADD COLUMN IF NOT EXISTS sip_id uuid
  REFERENCES sip_plans(id) ON DELETE SET NULL;

-- Index used by the daily cron to efficiently fetch due SIPs
CREATE INDEX sip_plans_next_exec_idx
  ON sip_plans(next_execution_date, status)
  WHERE status = 'active';
