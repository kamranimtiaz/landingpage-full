-- Hotels Import Script
-- Add your 50+ hotels to the database
--
-- IMPORTANT: GHA001, MVR002, and LSH003 are already inserted by the migration
-- Start from your own hotel codes

-- Example: Add new hotels (no duplicates)
INSERT INTO hotels (hotel_code, hotel_name) VALUES
  ('HAB011', 'Hotel Alpenblick'),
  ('BHS012', 'Berghotel Sonnenschein'),
  ('WRT013', 'Wellness Resort Tirol'),
  ('FHB014', 'Family Hotel Berghof'),
  ('BHE015', 'Boutique Hotel Edelweiss');
  -- Add your remaining hotels here

-- If you want to ADD MORE hotels, continue the pattern:
-- ('CODE016', 'Your Hotel Name'),

-- Tips for filling this out:
--
-- 1. hotel_code:
--    - Used in the URL: /submit/{hotel-code}
--    - Used by AlpineBits for ASA integration
--    - Examples: 'GHA001', 'MVR002', 'grand-hotel-alpen'
--    - Coordinate with ASA to get the correct codes (if required)
--    - Usually a short alphanumeric code (3-6 characters)
--    - Must be unique for each hotel
--
-- 2. hotel_name:
--    - The display name of the hotel
--    - Used in AlpineBits XML responses
--    - Use the official hotel name
--
-- To import this file:
--   Local: wrangler d1 execute hotel-booking-db --local --file=./examples/hotels-import.sql
--   Production: wrangler d1 execute hotel-booking-db --file=./examples/hotels-import.sql
