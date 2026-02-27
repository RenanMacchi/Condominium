-- Fix the ambiguous column reference in the listings update policy

DROP POLICY IF EXISTS "Users can safely update own listings" ON public.listings;

CREATE POLICY "Users can safely update own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING ( auth.uid() = owner_id )
  WITH CHECK (
    auth.uid() = owner_id AND
    created_at = (SELECT l.created_at FROM public.listings l WHERE l.id = listings.id) AND
    favorites_count = (SELECT l.favorites_count FROM public.listings l WHERE l.id = listings.id) AND
    report_count = (SELECT l.report_count FROM public.listings l WHERE l.id = listings.id)
  );
