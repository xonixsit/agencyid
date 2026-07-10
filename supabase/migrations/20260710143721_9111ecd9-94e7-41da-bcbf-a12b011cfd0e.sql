
CREATE POLICY "Team read client-assets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'client-assets');
CREATE POLICY "Team upload client-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-assets');
CREATE POLICY "Team update client-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'client-assets');
CREATE POLICY "Team delete client-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'client-assets');
