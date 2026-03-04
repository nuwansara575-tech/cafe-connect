
-- Add new columns to coupons for the claim flow
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS scanned_at timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
