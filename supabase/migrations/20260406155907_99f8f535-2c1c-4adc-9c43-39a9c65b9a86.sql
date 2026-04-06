CREATE TABLE public.creative_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  brief_type text NOT NULL DEFAULT 'ad_creative',
  platform text,
  dimensions jsonb,
  color_palette jsonb,
  visual_direction text,
  status public.output_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to creative_briefs" ON public.creative_briefs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert creative_briefs" ON public.creative_briefs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can manage creative_briefs" ON public.creative_briefs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_creative_briefs_updated_at BEFORE UPDATE ON public.creative_briefs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();