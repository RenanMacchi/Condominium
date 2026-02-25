-- Migration for Admin Banning and Analytics

-- 1. Add is_banned flag to profiles
ALTER TABLE public.profiles
ADD COLUMN is_banned BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Allow Admins to UPDATE profiles (to ban/unban users)
-- First, ensure there's a policy for updating profiles if none exists for admins
-- Users can already update their own profiles (existing policy in 000000_init), now admins can update any profile for banning
CREATE POLICY "Admins can update any profile (banning)"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ( EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true) );

-- 3. Create RPC for Dashboard Analytics
-- This runs on the database side for maximum efficiency, returning 3 counts at once
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS json
AS $$
DECLARE
  total_active_listings INTEGER;
  total_completed_listings INTEGER;
  total_users INTEGER;
BEGIN
  -- Count active listings
  SELECT COUNT(*) INTO total_active_listings 
  FROM public.listings 
  WHERE status = 'ATIVO';

  -- Count completed listings
  SELECT COUNT(*) INTO total_completed_listings 
  FROM public.listings 
  WHERE status = 'CONCLUIDO';

  -- Count total registered users
  SELECT COUNT(*) INTO total_users 
  FROM public.profiles;

  -- Return as JSON object
  RETURN json_build_object(
    'activeListings', total_active_listings,
    'completedListings', total_completed_listings,
    'totalUsers', total_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
