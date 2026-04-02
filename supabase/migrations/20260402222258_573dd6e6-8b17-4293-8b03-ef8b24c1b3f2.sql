
-- Create enum for client status
CREATE TYPE public.client_status AS ENUM ('onboarding', 'active', 'paused', 'completed');

-- Create enum for copy types
CREATE TYPE public.copy_type AS ENUM ('ad_copy', 'email_sequence', 'landing_page', 'sales_page', 'social_post', 'sms', 'headline');

-- Create enum for output status
CREATE TYPE public.output_status AS ENUM ('draft', 'review', 'approved', 'deployed');

-- Create enum for strategy type
CREATE TYPE public.strategy_type AS ENUM ('full_funnel', 'top_of_funnel', 'mid_funnel', 'bottom_funnel', 'retention');

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT,
  offer TEXT,
  target_audience TEXT,
  positioning TEXT,
  goals TEXT,
  brand_voice TEXT,
  competitors TEXT,
  budget TEXT,
  website_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  status client_status NOT NULL DEFAULT 'onboarding',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Strategies table
CREATE TABLE public.strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  strategy_type strategy_type NOT NULL DEFAULT 'full_funnel',
  title TEXT NOT NULL,
  funnel_structure JSONB,
  campaign_channels TEXT[],
  target_segments JSONB,
  key_messages TEXT[],
  content TEXT NOT NULL,
  status output_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Copy outputs table
CREATE TABLE public.copy_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL,
  copy_type copy_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platform TEXT,
  tone TEXT,
  target_audience TEXT,
  call_to_action TEXT,
  status output_status NOT NULL DEFAULT 'draft',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_outputs ENABLE ROW LEVEL SECURITY;

-- Agency-wide access for authenticated users
CREATE POLICY "Authenticated users can manage clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage strategies" ON public.strategies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage copy outputs" ON public.copy_outputs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_copy_outputs_updated_at BEFORE UPDATE ON public.copy_outputs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
