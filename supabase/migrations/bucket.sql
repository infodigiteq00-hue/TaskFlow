-- company-logo
-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload company-logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Allow authenticated users to read
CREATE POLICY "Authenticated read company-logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'company-logos');

-- Allow authenticated users to update
CREATE POLICY "Authenticated update company-logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos')
WITH CHECK (bucket_id = 'company-logos');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated delete company-logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos');

-- task-files

CREATE POLICY "Users upload own task-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Read
CREATE POLICY "Users read own task-files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update
CREATE POLICY "Users update own task-files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'task-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete
CREATE POLICY "Users delete own task-files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- audio
CREATE POLICY "Users upload own audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own audio"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own audio"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own audio"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);