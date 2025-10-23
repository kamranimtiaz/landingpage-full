-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id TEXT UNIQUE NOT NULL,
  hotel_name TEXT NOT NULL,
  hotel_code TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Guest requests table
CREATE TABLE IF NOT EXISTS guest_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT UNIQUE NOT NULL,
  hotel_id TEXT NOT NULL,

  -- Date information
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,

  -- Guest information
  adult_count INTEGER NOT NULL,
  children_count INTEGER DEFAULT 0,
  child_ages TEXT, -- JSON array of ages

  -- Room information
  selected_room TEXT,

  -- Guest details
  gender TEXT, -- 'Male' or 'Female'
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  language TEXT DEFAULT 'de',

  -- Additional information
  comments TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'acknowledged'

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  acknowledged_at DATETIME,

  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_requests_hotel_id ON guest_requests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_guest_requests_status ON guest_requests(status);
CREATE INDEX IF NOT EXISTS idx_guest_requests_created_at ON guest_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_hotels_hotel_code ON hotels(hotel_code);

-- Analytics/logging table (optional)
CREATE TABLE IF NOT EXISTS request_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT,
  event_type TEXT NOT NULL, -- 'submitted', 'sent', 'acknowledged', 'error'
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample hotel data (you can add your 50+ hotels here)
INSERT INTO hotels (hotel_id, hotel_name, hotel_code) VALUES
  ('hotel-1', 'Grand Hotel Alpen', 'GHA001'),
  ('hotel-2', 'Mountain View Resort', 'MVR002'),
  ('hotel-3', 'Luxury Spa Hotel', 'LSH003'),
  ('template-hotel', 'Template Hotel', 'TMPL001');
