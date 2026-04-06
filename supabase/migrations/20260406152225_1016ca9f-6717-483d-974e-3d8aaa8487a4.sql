CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  title text NOT NULL,
  automation_type text NOT NULL DEFAULT 'nurture_sequence',
  trigger_event text,
  workflow_steps jsonb,
  ghl_template jsonb,
  content text NOT NULL,
  status public.output_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to automations" ON public.automations FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert automations" ON public.automations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can manage automations" ON public.automations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON public.automations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();