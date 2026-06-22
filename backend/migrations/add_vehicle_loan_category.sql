-- Add 'vehicle_loan' to the networth_items category CHECK constraint.
-- Run this in Supabase Dashboard → SQL Editor.

ALTER TABLE networth_items
  DROP CONSTRAINT IF EXISTS networth_items_category_check;

ALTER TABLE networth_items
  ADD CONSTRAINT networth_items_category_check
  CHECK (category IN (
    'cash',
    'emergency',
    'property',
    'vehicle',
    'vehicle_loan',
    'other_asset',
    'debt',
    'emi',
    'other_liability'
  ));
