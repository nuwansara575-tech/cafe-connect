
-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  offer TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scans table
CREATE TABLE public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  token UUID NOT NULL,
  scan_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  device TEXT,
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT false
);

-- Add campaign_id to coupons
ALTER TABLE public.coupons ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_scans_token ON public.scans(token);
CREATE INDEX idx_scans_scan_time ON public.scans(scan_time);
CREATE INDEX idx_coupons_campaign_id ON public.coupons(campaign_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);

-- User roles setup
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for campaigns: authenticated can CRUD
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read campaigns"
  ON public.campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert campaigns"
  ON public.campaigns FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
  ON public.campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaigns"
  ON public.campaigns FOR DELETE TO authenticated USING (true);

-- RLS for scans: authenticated can read, service role inserts
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read scans"
  ON public.scans FOR SELECT TO authenticated USING (true);

-- RLS for user_roles: only admins can read
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add INSERT/UPDATE policies for coupons for authenticated users
CREATE POLICY "Authenticated users can insert coupons"
  ON public.coupons FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update coupons"
  ON public.coupons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for scans
ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;
