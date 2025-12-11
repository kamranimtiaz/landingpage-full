-- Migration: Add selected_offer column to store offer selection
-- Date: 2025-11-18

ALTER TABLE guest_requests ADD COLUMN selected_offer TEXT;
