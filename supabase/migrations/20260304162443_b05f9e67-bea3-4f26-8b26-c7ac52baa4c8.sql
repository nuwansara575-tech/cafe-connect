
-- Fix scans: drop restrictive policy, create permissive one
DROP POLICY IF EXISTS "Authenticated users can read scans" ON public.scans;
CREATE POLICY "Authenticated users can read scans" ON public.scans FOR SELECT TO authenticated USING (true);

-- Fix campaigns: drop restrictive policies, create permissive ones
DROP POLICY IF EXISTS "Authenticated users can read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON public.campaigns;
CREATE POLICY "Authenticated users can read campaigns" ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (true);

-- Fix coupons: drop restrictive policies, create permissive ones
DROP POLICY IF EXISTS "Anyone can read coupons by token" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can delete coupons" ON public.coupons;
CREATE POLICY "Anyone can read coupons by token" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update coupons" ON public.coupons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete coupons" ON public.coupons FOR DELETE TO authenticated USING (true);

-- Fix user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
