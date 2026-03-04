
-- Fix coupons RLS: restrict all operations to admins, remove public access
-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can read coupons by token" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can update coupons" ON public.coupons;

-- Admins can do everything on coupons
CREATE POLICY "Admins can read coupons" ON public.coupons FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fix campaigns RLS: restrict all operations to admins
DROP POLICY IF EXISTS "Authenticated users can read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON public.campaigns;

CREATE POLICY "Admins can read campaigns" ON public.campaigns FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
