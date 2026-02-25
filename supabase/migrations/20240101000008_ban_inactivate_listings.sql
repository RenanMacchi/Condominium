-- Migration to automatically inactivate all listings of a banned user

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_user_ban()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the is_banned flag was changed from false to true
  IF NEW.is_banned = true AND OLD.is_banned = false THEN
    -- Inactivate all active listings owned by this user
    UPDATE public.listings
    SET status = 'INATIVO'
    WHERE owner_id = NEW.id AND status != 'INATIVO';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the profiles table
DROP TRIGGER IF EXISTS on_user_banned ON public.profiles;
CREATE TRIGGER on_user_banned
  AFTER UPDATE OF is_banned ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_user_ban();
