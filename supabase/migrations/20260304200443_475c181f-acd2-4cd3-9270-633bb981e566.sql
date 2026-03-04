
-- Create customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile_number text UNIQUE NOT NULL,
  email text,
  birthday date,
  first_scan_date timestamp with time zone DEFAULT now(),
  total_scans integer NOT NULL DEFAULT 0,
  total_claims integer NOT NULL DEFAULT 0,
  total_redemptions integer NOT NULL DEFAULT 0,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add customer_id to coupons
ALTER TABLE public.coupons ADD COLUMN customer_id uuid REFERENCES public.customers(id);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admin can CRUD customers
CREATE POLICY "Admins can read customers" ON public.customers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update customers" ON public.customers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete customers" ON public.customers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role (edge functions) bypasses RLS, so no public policy needed for claim flow
