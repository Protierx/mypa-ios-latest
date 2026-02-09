-- =====================================================
-- Migration: Add push_token to profiles
-- 
-- This column was defined in 001_schema.sql's CREATE TABLE,
-- but the table pre-existed that migration, so CREATE TABLE
-- IF NOT EXISTS skipped it and the column was never added.
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
