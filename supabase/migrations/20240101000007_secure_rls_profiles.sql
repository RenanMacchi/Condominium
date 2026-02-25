-- Migration to Secure Admin Privileges and Prevent PostgREST Escalation

-- 1. Drop the flawed wide-open update policy for users on their own profiles
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- 2. Recreate the policy with a strict CHECK constraint that blocks modifying protected columns
-- The OLD and NEW records must have the exact same 'is_admin' and 'is_banned' values.
-- This ensures a user can only update their display name, whatsapp, avatar, etc., but cannot elevate themselves to admin or unban themselves.
CREATE POLICY "Users can update own profile safely"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( 
    auth.uid() = id AND 
    is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) AND
    is_banned = (SELECT is_banned FROM public.profiles WHERE id = auth.uid())
  );

-- Note: Admins still use their separate policy "Admins can update any profile (banning)" 
-- from migration 000006 to alter the is_banned status of OTHERS.

-- 3. Secure the Listings table
-- Users should not be able to artificially inflate their own favorites_count or reset their report_count
DROP POLICY IF EXISTS "Users can update own listings." ON public.listings;

CREATE POLICY "Users can safely update own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING ( auth.uid() = owner_id )
  WITH CHECK (
    auth.uid() = owner_id AND
    created_at = (SELECT created_at FROM public.listings WHERE id = listings.id) AND
    favorites_count = (SELECT favorites_count FROM public.listings WHERE id = listings.id) AND
    report_count = (SELECT report_count FROM public.listings WHERE id = listings.id)
  );
