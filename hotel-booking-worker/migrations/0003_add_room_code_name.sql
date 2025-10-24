-- Add separate room code and name columns
-- This allows proper AlpineBits mapping using the code

ALTER TABLE guest_requests ADD COLUMN selected_room_code TEXT;
ALTER TABLE guest_requests ADD COLUMN selected_room_name TEXT;

-- Create index for room code lookups
CREATE INDEX IF NOT EXISTS idx_guest_requests_room_code ON guest_requests(selected_room_code);
