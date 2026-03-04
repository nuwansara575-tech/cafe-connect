-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  campaign_name TEXT NOT NULL DEFAULT 'Cafe Connect – Special Promotion',
  offer_title TEXT NOT NULL DEFAULT 'Get 15% OFF your order',
  offer_description TEXT NOT NULL DEFAULT 'Present this coupon at checkout to enjoy your discount.',
  discount_value TEXT NOT NULL DEFAULT '15%',
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'redeemed', 'expired')),
  coupon_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for fast lookups
CREATE INDEX idx_coupons_token ON public.coupons (token);
CREATE INDEX idx_coupons_status ON public.coupons (status);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads for redemption page
CREATE POLICY "Anyone can read coupons by token"
  ON public.coupons
  FOR SELECT
  USING (true);

-- Allow deletes from the admin panel
CREATE POLICY "Anyone can delete coupons"
  ON public.coupons
  FOR DELETE
  USING (true);