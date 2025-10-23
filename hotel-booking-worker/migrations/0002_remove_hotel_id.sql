-- Migration: Remove hotel_id column and use hotel_code for everything
-- This migration consolidates hotel identification to use only hotel_code

-- Step 1: Create new hotels table without hotel_id
CREATE TABLE IF NOT EXISTS hotels_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_code TEXT UNIQUE NOT NULL,
  hotel_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy data from old table (hotel_id becomes hotel_code if hotel_code is empty)
INSERT INTO hotels_new (id, hotel_code, hotel_name, created_at, updated_at)
SELECT id, hotel_code, hotel_name, created_at, updated_at
FROM hotels;

-- Step 3: Create new guest_requests table with hotel_code foreign key
CREATE TABLE IF NOT EXISTS guest_requests_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT UNIQUE NOT NULL,
  hotel_code TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adult_count INTEGER NOT NULL DEFAULT 2,
  children_count INTEGER NOT NULL DEFAULT 0,
  child_ages TEXT,
  selected_room TEXT,
  gender TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'de',
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  acknowledged_at DATETIME,
  FOREIGN KEY (hotel_code) REFERENCES hotels(hotel_code)
);

-- Step 4: Migrate guest_requests data (hotel_id -> hotel_code lookup)
INSERT INTO guest_requests_new (
  id, request_id, hotel_code, check_in_date, check_out_date,
  adult_count, children_count, child_ages, selected_room,
  gender, first_name, last_name, phone_number, email, language,
  comments, status, created_at, sent_at, acknowledged_at
)
SELECT
  gr.id, gr.request_id, h.hotel_code, gr.check_in_date, gr.check_out_date,
  gr.adult_count, gr.children_count, gr.child_ages, gr.selected_room,
  gr.gender, gr.first_name, gr.last_name, gr.phone_number, gr.email, gr.language,
  gr.comments, gr.status, gr.created_at, gr.sent_at, gr.acknowledged_at
FROM guest_requests gr
JOIN hotels h ON gr.hotel_id = h.hotel_id;

-- Step 5: Drop old tables
DROP TABLE guest_requests;
DROP TABLE hotels;

-- Step 6: Rename new tables
ALTER TABLE hotels_new RENAME TO hotels;
ALTER TABLE guest_requests_new RENAME TO guest_requests;

-- Step 7: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_guest_requests_hotel_code ON guest_requests(hotel_code);
CREATE INDEX IF NOT EXISTS idx_guest_requests_status ON guest_requests(status);
CREATE INDEX IF NOT EXISTS idx_hotels_hotel_code ON hotels(hotel_code);
