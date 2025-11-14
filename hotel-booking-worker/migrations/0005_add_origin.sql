-- Migration: Add origin field to track traffic source
-- Date: 2025-11-04

ALTER TABLE guest_requests ADD COLUMN origin TEXT;

-- Add index for querying by origin
CREATE INDEX IF NOT EXISTS idx_guest_requests_origin ON guest_requests(origin);
