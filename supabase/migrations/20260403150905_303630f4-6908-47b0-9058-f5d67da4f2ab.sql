CREATE TABLE public.media_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  platform text NOT NULL DEFAULT 'meta',
  campaign_objective text NOT NULL DEFAULT 'conversions',
  total_budget text,
  daily_budget text,
  audience_targeting jsonb,
  ad_placements jsonb,
  campaign_structure jsonb,
  status public.output_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage media plans" ON public.media_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read access to media plans" ON public.media_plans FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert media plans" ON public.media_plans FOR INSERT TO anon WITH CHECK (true);

CREATE TRIGGER update_media_plans_updated_at BEFORE UPDATE ON public.media_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();