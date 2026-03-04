
-- Fix user_roles: drop restrictive, create permissive
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix campaigns
DROP POLICY IF EXISTS "Admins can read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can delete campaigns" ON public.campaigns;
CREATE POLICY "Admins can read campaigns" ON public.campaigns FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix coupons
DROP POLICY IF EXISTS "Admins can read coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
CREATE POLICY "Admins can read coupons" ON public.coupons FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix scans
DROP POLICY IF EXISTS "Admins can read scans" ON public.scans;
CREATE POLICY "Admins can read scans" ON public.scans FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
