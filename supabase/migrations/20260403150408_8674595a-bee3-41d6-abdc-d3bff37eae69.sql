CREATE POLICY "Allow anon read access to clients" ON public.clients FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access to strategies" ON public.strategies FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access to copy_outputs" ON public.copy_outputs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert clients" ON public.clients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert strategies" ON public.strategies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert copy_outputs" ON public.copy_outputs FOR INSERT TO anon WITH CHECK (true);