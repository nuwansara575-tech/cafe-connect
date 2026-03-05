
-- Loyalty accounts linked to existing customers
CREATE TABLE public.loyalty_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'Bronze',
  total_visits integer NOT NULL DEFAULT 0,
  total_rewards_redeemed integer NOT NULL DEFAULT 0,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

-- Loyalty transactions
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  points integer NOT NULL,
  type text NOT NULL DEFAULT 'earn',
  source text NOT NULL DEFAULT 'visit',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Loyalty rewards catalog
CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_name text NOT NULL,
  points_required integer NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Point rules configuration
CREATE TABLE public.loyalty_point_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  points integer NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_point_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies (admin only, permissive)
CREATE POLICY "Admins can manage loyalty_accounts" ON public.loyalty_accounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage loyalty_transactions" ON public.loyalty_transactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage loyalty_rewards" ON public.loyalty_rewards FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage loyalty_point_rules" ON public.loyalty_point_rules FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default point rules
INSERT INTO public.loyalty_point_rules (rule_name, points, description) VALUES
  ('Store Visit', 10, 'Points awarded for each visit to the store'),
  ('Purchase Above Threshold', 20, 'Points for purchases above a certain amount'),
  ('Special Campaign', 50, 'Bonus points for special campaign participation');

-- Insert default rewards
INSERT INTO public.loyalty_rewards (reward_name, points_required, description) VALUES
  ('Free Coffee', 50, 'Redeem for a free coffee of your choice'),
  ('20% Discount', 100, 'Get 20% off your entire order'),
  ('Free Dessert', 200, 'Enjoy a complimentary dessert');
