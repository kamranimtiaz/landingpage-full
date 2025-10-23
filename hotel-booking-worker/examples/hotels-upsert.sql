-- Hotels Upsert Script
-- This version uses INSERT OR REPLACE to safely handle duplicates
-- Safe to run multiple times - will update existing hotels

-- INSERT OR REPLACE will:
-- - INSERT if the hotel doesn't exist
-- - UPDATE if the hotel_code already exists

INSERT OR REPLACE INTO hotels (hotel_code, hotel_name) VALUES
  -- Sample hotels (from migration)
  ('GHA001', 'Grand Hotel Alpen'),
  ('MVR002', 'Mountain View Resort'),
  ('LSH003', 'Luxury Spa Hotel'),

  -- Add your additional hotels here
  ('HAB011', 'Hotel Alpenblick'),
  ('BHS012', 'Berghotel Sonnenschein'),
  ('WRT013', 'Wellness Resort Tirol'),
  ('FHB014', 'Family Hotel Berghof'),
  ('BHE015', 'Boutique Hotel Edelweiss'),
  ('RHR016', 'Romantik Hotel Rosengarten'),
  ('SSR017', 'Sport & Spa Resort'),
  ('GHP018', 'Gourmet Hotel Panorama'),
  ('ALP019', 'Alpine Paradise'),
  ('FHS020', 'Family Hotel Sonnenhof');
  -- Continue with more hotel codes

-- Usage:
--   Local:  wrangler d1 execute hotel-booking-db --local --file=./examples/hotels-upsert.sql
--   Remote: wrangler d1 execute hotel-booking-db --remote --file=./examples/hotels-upsert.sql

-- Benefits of INSERT OR REPLACE:
-- ✓ No UNIQUE constraint errors
-- ✓ Can update hotel names or codes if they change
-- ✓ Safe to run during deployment
-- ✓ Idempotent (same result if run multiple times)

-- Note: This will replace the entire row, so make sure all 3 fields are correct
