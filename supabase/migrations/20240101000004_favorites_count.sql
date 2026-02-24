-- Migration for counting favorites on listings

-- 1. Add favorites_count column
ALTER TABLE public.listings 
ADD COLUMN favorites_count INTEGER DEFAULT 0 NOT NULL;

-- 2. Retroactively update existing counts based on the favorites table
UPDATE public.listings l
SET favorites_count = (
  SELECT count(*) 
  FROM public.favorites f 
  WHERE f.listing_id = l.id
);

-- 3. Create function for the trigger
CREATE OR REPLACE FUNCTION public.handle_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.listings 
    SET favorites_count = favorites_count + 1 
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.listings 
    SET favorites_count = favorites_count - 1 
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger on favorites
CREATE TRIGGER update_listing_favorite_count
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_favorite_count();
