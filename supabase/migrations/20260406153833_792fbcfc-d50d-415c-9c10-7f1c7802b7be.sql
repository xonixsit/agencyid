CREATE TABLE public.funnel_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES public.strategies(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  funnel_type TEXT NOT NULL DEFAULT 'lead_generation',
  page_count INTEGER DEFAULT 1,
  sections JSONB,
  flow_structure JSONB,
  ghl_template JSONB,
  status public.output_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funnel_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to funnel_designs" ON public.funnel_designs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert funnel_designs" ON public.funnel_designs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can manage funnel_designs" ON public.funnel_designs FOR ALL TO authenticated USING (true) WITH CHECK (true);