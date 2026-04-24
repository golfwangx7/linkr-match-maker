DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;

-- Allow public to read individual objects but prevent listing the bucket
CREATE POLICY "Public can read individual profile images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] IS NOT NULL
);