
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  notify_review_ready BOOLEAN NOT NULL DEFAULT true,
  notify_weekly_digest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles visible to authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins see all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + role on signup. First user → admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'avatar_url');

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO is_first;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, CASE WHEN is_first THEN 'admin'::app_role ELSE 'member'::app_role END);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BRAND ASSETS ============
CREATE TYPE public.brand_asset_type AS ENUM ('logo', 'image', 'color', 'font', 'document', 'link');

CREATE TABLE public.brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  asset_type brand_asset_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,          -- for logo/image/document
  storage_path TEXT,      -- storage object path for cleanup
  value TEXT,             -- for color (#hex) or font (family/spec) or link URL
  meta JSONB,             -- e.g. { weight, usage, palette_role }
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_assets TO authenticated;
GRANT ALL ON public.brand_assets TO service_role;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view brand assets" ON public.brand_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert brand assets" ON public.brand_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update brand assets" ON public.brand_assets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Team can delete brand assets" ON public.brand_assets FOR DELETE TO authenticated USING (true);
CREATE INDEX idx_brand_assets_client ON public.brand_assets(client_id);
CREATE TRIGGER update_brand_assets_updated_at BEFORE UPDATE ON public.brand_assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LOCK DOWN EXISTING TABLES (remove anon access) ============
DROP POLICY IF EXISTS "Allow anon insert clients" ON public.clients;
DROP POLICY IF EXISTS "Allow anon read access to clients" ON public.clients;
REVOKE ALL ON public.clients FROM anon;

DO $$
DECLARE
  t TEXT;
  pol RECORD;
BEGIN
  FOR t IN SELECT unnest(ARRAY['strategies','copy_outputs','media_plans','automations','funnel_designs','creative_briefs','generated_visuals','project_tasks']) LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public' AND 'anon' = ANY(roles) LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;
