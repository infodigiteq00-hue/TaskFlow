-- =============================================================================
-- TaskFlow – Storage buckets (create + policies)
-- =============================================================================

-- Bucket creation
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('company-logos', 'company-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']),
  ('task-files', 'task-files', true, 15728640, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
  ('audio', 'audio', true, 10485760, ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- company-logos policies
CREATE POLICY "Authenticated upload company-logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-logos');
CREATE POLICY "Authenticated read company-logos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'company-logos');
CREATE POLICY "Authenticated update company-logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'company-logos') WITH CHECK (bucket_id = 'company-logos');
CREATE POLICY "Authenticated delete company-logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'company-logos');

-- task-files policies
CREATE POLICY "Users upload own task-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own task-files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'task-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own task-files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'task-files' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'task-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own task-files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'task-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- audio policies
CREATE POLICY "Users upload own audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own audio" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own audio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own audio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);