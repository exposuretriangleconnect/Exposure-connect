/*
# Create Core Tables - Photography Marketplace

## Overview
Creates the foundational tables for the LensWork photography marketplace app.

## New Tables
1. `profiles` - Extends auth.users with user display info (name, photo, phone, location, about, verification status, profile completion %)
2. `user_capabilities` - Multiple capabilities per user (offer_services, find_jobs, hire_photographers, post_jobs, rent_equipment, rent_out_equipment)
3. `categories` - Photography categories (Wedding, Portrait, Events, etc.) - admin managed
4. `otp_codes` - Stores OTP codes for phone authentication with expiry, max attempts, rate limiting
5. `system_settings` - Admin-configurable key/value settings (subscription prices, ad duration, etc.)

## Security
- RLS enabled on all tables
- profiles: users can read all profiles (marketplace), update only their own
- user_capabilities: users can read all, update only their own
- categories: public read, admin write (via service role)
- otp_codes: no direct access (only edge functions with service role)
- system_settings: public read, admin write (via service role)
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  phone text UNIQUE NOT NULL,
  name text,
  profile_photo text,
  city text,
  district text,
  state text,
  about text,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','rejected','suspended')),
  profile_completion int NOT NULL DEFAULT 0,
  onboarding_completed boolean NOT NULL DEFAULT false,
  upi_qr_code text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ USER CAPABILITIES ============
CREATE TABLE IF NOT EXISTS user_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  capability text NOT NULL CHECK (capability IN ('offer_services','find_jobs','hire_photographers','post_jobs','rent_equipment','rent_out_equipment')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, capability)
);

ALTER TABLE user_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "capabilities_select_all" ON user_capabilities;
CREATE POLICY "capabilities_select_all" ON user_capabilities FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "capabilities_insert_own" ON user_capabilities;
CREATE POLICY "capabilities_insert_own" ON user_capabilities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "capabilities_update_own" ON user_capabilities;
CREATE POLICY "capabilities_update_own" ON user_capabilities FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "capabilities_delete_own" ON user_capabilities;
CREATE POLICY "capabilities_delete_own" ON user_capabilities FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- ============ OTP CODES ============
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- No policies - only accessible via service role (edge functions)

-- ============ SYSTEM SETTINGS ============
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_all" ON system_settings;
CREATE POLICY "settings_select_all" ON system_settings FOR SELECT
  TO anon, authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_capabilities_user ON user_capabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ SEED CATEGORIES ============
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Wedding', 'wedding', 1),
  ('Portrait', 'portrait', 2),
  ('Events', 'events', 3),
  ('Corporate', 'corporate', 4),
  ('Product', 'product', 5),
  ('Fashion', 'fashion', 6),
  ('Real Estate', 'real-estate', 7),
  ('Wildlife', 'wildlife', 8),
  ('Sports', 'sports', 9),
  ('Food', 'food', 10),
  ('Travel', 'travel', 11),
  ('Newborn', 'newborn', 12),
  ('Maternity', 'maternity', 13),
  ('Pre-Wedding', 'pre-wedding', 14),
  ('Birthday', 'birthday', 15),
  ('Other', 'other', 99)
ON CONFLICT (slug) DO NOTHING;

-- ============ SEED SYSTEM SETTINGS ============
INSERT INTO system_settings (key, value, description) VALUES
  ('subscription_monthly_price', '199', 'Monthly subscription price in INR'),
  ('subscription_yearly_price', '1999', 'Yearly subscription price in INR'),
  ('subscription_yearly_free_months', '2', 'Number of free months for yearly plan'),
  ('subscription_active', 'true', 'Whether subscription is available for purchase'),
  ('ad_default_duration_seconds', '30', 'Default full-screen ad duration in seconds'),
  ('ad_frequency_minutes', '5', 'Ad frequency in minutes between ads'),
  ('ads_enabled', 'true', 'Whether platform ads are enabled for non-subscribers'),
  ('paid_ad_price', '499', 'Price for user-paid advertisements in INR'),
  ('otp_expiry_minutes', '5', 'OTP expiration time in minutes'),
  ('otp_max_attempts', '5', 'Maximum OTP verification attempts'),
  ('otp_resend_cooldown_seconds', '30', 'OTP resend cooldown in seconds')
ON CONFLICT (key) DO NOTHING;
