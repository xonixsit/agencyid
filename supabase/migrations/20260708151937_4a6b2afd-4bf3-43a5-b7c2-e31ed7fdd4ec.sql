
CREATE TABLE public.generated_visuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES public.creative_briefs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  platform TEXT,
  aspect_ratio TEXT,
  variation_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_visuals TO authenticated;
GRANT SELECT ON public.generated_visuals TO anon;
GRANT ALL ON public.generated_visuals TO service_role;

ALTER TABLE public.generated_visuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view generated_visuals" ON public.generated_visuals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert generated_visuals" ON public.generated_visuals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete generated_visuals" ON public.generated_visuals FOR DELETE USING (true);

CREATE TRIGGER update_generated_visuals_updated_at BEFORE UPDATE ON public.generated_visuals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
