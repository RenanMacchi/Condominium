-- Migration: Add fields for Business Hours

-- 1. Add new columns to listings table
ALTER TABLE public.listings 
ADD COLUMN has_business_hours BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN business_days INTEGER[],
ADD COLUMN open_time TIME,
ADD COLUMN close_time TIME;
