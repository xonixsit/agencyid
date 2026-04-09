
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  assigned_to TEXT,
  due_date DATE,
  deliverable_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to project_tasks" ON public.project_tasks FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert project_tasks" ON public.project_tasks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can manage project_tasks" ON public.project_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
