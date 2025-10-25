-- Add separate offer code and name columns
-- This allows proper AlpineBits mapping and tracking of offer details

ALTER TABLE guest_requests ADD COLUMN selected_offer_code TEXT;
ALTER TABLE guest_requests ADD COLUMN selected_offer_name TEXT;

-- Create index for offer code lookups
CREATE INDEX IF NOT EXISTS idx_guest_requests_offer_code ON guest_requests(selected_offer_code);
