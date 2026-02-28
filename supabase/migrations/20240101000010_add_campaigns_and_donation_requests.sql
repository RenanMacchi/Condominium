-- Migration: Add fields for Pedidos de doação and Campanhas

-- 1. Add new columns to listings table
ALTER TABLE public.listings 
ADD COLUMN is_donation_request BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN campaign_link TEXT,
ADD COLUMN campaign_location TEXT;

-- 2. Update ListingType check constraint to allow 'CAMPANHA'
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_type_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_type_check CHECK (type IN ('VENDA', 'DOACAO', 'SERVICO', 'CAMPANHA'));

-- 3. Create a trigger to prevent non-admins from creating or editing campaigns
CREATE OR REPLACE FUNCTION public.check_campaign_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'CAMPANHA' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    ) THEN
      RAISE EXCEPTION 'Apenas administradores podem criar ou editar campanhas.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_campaign_admin
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_campaign_admin();
