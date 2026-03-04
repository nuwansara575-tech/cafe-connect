
DROP POLICY IF EXISTS "Authenticated users can read scans" ON public.scans;

CREATE POLICY "Admins can read scans"
  ON public.scans
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
