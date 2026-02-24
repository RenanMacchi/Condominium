-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view photos
CREATE POLICY "Public Access" 
  ON storage.objects FOR SELECT 
  USING ( bucket_id = 'listing-photos' );

-- 3. Allow authenticated users to upload photos
CREATE POLICY "Users can upload photos" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK ( bucket_id = 'listing-photos' );

-- 4. Allow users to update/delete their own uploaded photos
CREATE POLICY "Users can edit own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ( bucket_id = 'listing-photos' AND auth.uid() = owner );

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'listing-photos' AND auth.uid() = owner );
