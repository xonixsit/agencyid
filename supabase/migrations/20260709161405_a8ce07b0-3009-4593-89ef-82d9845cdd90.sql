
-- Add review workflow columns to all output tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['strategies','copy_outputs','media_plans','automations','funnel_designs','creative_briefs','generated_visuals','project_tasks'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT ''in_review''', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS review_notes text', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.%I(id) ON DELETE SET NULL', t, t);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (review_status IN (''draft'',''in_review'',''approved'',''rejected'',''deployed''))', t, t || '_review_status_chk');
    -- backfill existing rows so day-one has nothing blocking
    EXECUTE format('UPDATE public.%I SET review_status = ''approved'' WHERE review_status = ''in_review''', t);
  END LOOP;
END $$;

-- Auto-chain toggle on clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS auto_chain boolean NOT NULL DEFAULT true;
