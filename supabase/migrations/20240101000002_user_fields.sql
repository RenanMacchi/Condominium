-- Remove old fields and add new fields to profiles
ALTER TABLE public.profiles ADD COLUMN site TEXT;
ALTER TABLE public.profiles ADD COLUMN house TEXT;
-- We can drop them if we want, but letting them stay is safer for old data.
-- ALTER TABLE public.profiles DROP COLUMN apartment;
-- ALTER TABLE public.profiles DROP COLUMN block;

-- Add show_contact to listings
ALTER TABLE public.listings ADD COLUMN show_contact BOOLEAN DEFAULT true NOT NULL;
