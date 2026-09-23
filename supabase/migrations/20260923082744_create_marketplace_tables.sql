/*
# Create Marketplace Tables - Photography Marketplace

## Overview
Creates tables for photographer profiles, availability, jobs, applications, bookings, equipment, rentals, portfolios, messaging, notifications, reviews, reports, subscriptions, and advertisements.

## New Tables
1. `photographer_profiles` - Extended profile data for users offering services
2. `portfolio_albums` - Albums grouping portfolio items
3. `portfolio_items` - Individual photos/videos in portfolios
4. `availability` - Photographer availability posts
5. `availability_blocks` - Blocked/unavailable dates
6. `job_posts` - Photography jobs posted by clients
7. `job_applications` - Photographer applications with proposals
8. `bookings` - Confirmed bookings
9. `equipment` - Equipment listings
10. `equipment_availability` - Equipment availability/blocks
11. `rental_requests` - Rental requests
12. `message_threads` - Conversation threads
13. `messages` - Individual messages
14. `notifications` - In-app notifications
15. `notification_preferences` - User notification preferences
16. `subscriptions` - User subscription records
17. `subscription_transactions` - Payment records
18. `advertisements` - Platform and user-paid ads
19. `ad_impressions` - Ad view tracking
20. `reviews` - Reviews for completed transactions
21. `reports` - User-submitted reports
22. `service_regions` - User-defined service areas

## Security
- RLS enabled on all tables with appropriate ownership/participant policies
*/

-- ============ PHOTOGRAPHER PROFILES ============
CREATE TABLE IF NOT EXISTS photographer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  experience_years int,
  starting_price int,
  languages text[] DEFAULT '{}',
  is_available boolean NOT NULL DEFAULT true,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  total_reviews int NOT NULL DEFAULT 0,
  completed_jobs int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE photographer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photo_profiles_select_all" ON photographer_profiles;
CREATE POLICY "photo_profiles_select_all" ON photographer_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "photo_profiles_insert_own" ON photographer_profiles;
CREATE POLICY "photo_profiles_insert_own" ON photographer_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "photo_profiles_update_own" ON photographer_profiles;
CREATE POLICY "photo_profiles_update_own" ON photographer_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "photo_profiles_delete_own" ON photographer_profiles;
CREATE POLICY "photo_profiles_delete_own" ON photographer_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ PORTFOLIO ALBUMS ============
CREATE TABLE IF NOT EXISTS portfolio_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id),
  location text,
  shoot_date date,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "albums_select_all" ON portfolio_albums;
CREATE POLICY "albums_select_all" ON portfolio_albums FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "albums_insert_own" ON portfolio_albums;
CREATE POLICY "albums_insert_own" ON portfolio_albums FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "albums_update_own" ON portfolio_albums;
CREATE POLICY "albums_update_own" ON portfolio_albums FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "albums_delete_own" ON portfolio_albums;
CREATE POLICY "albums_delete_own" ON portfolio_albums FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ PORTFOLIO ITEMS ============
CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES portfolio_albums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'photo' CHECK (type IN ('photo','video')),
  media_url text NOT NULL,
  thumbnail_url text,
  title text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "items_select_all" ON portfolio_items;
CREATE POLICY "items_select_all" ON portfolio_items FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "items_insert_own" ON portfolio_items;
CREATE POLICY "items_insert_own" ON portfolio_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "items_update_own" ON portfolio_items;
CREATE POLICY "items_update_own" ON portfolio_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "items_delete_own" ON portfolio_items;
CREATE POLICY "items_delete_own" ON portfolio_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ AVAILABILITY ============
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  available_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  service_region text,
  category_id uuid REFERENCES categories(id),
  price_from int,
  price_to int,
  travel_available boolean NOT NULL DEFAULT true,
  travel_charges int,
  expiry_date date,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','booked','expired','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availability_select_all" ON availability;
CREATE POLICY "availability_select_all" ON availability FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "availability_insert_own" ON availability;
CREATE POLICY "availability_insert_own" ON availability FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "availability_update_own" ON availability;
CREATE POLICY "availability_update_own" ON availability FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "availability_delete_own" ON availability;
CREATE POLICY "availability_delete_own" ON availability FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ AVAILABILITY BLOCKS ============
CREATE TABLE IF NOT EXISTS availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_select_all" ON availability_blocks;
CREATE POLICY "blocks_select_all" ON availability_blocks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "blocks_insert_own" ON availability_blocks;
CREATE POLICY "blocks_insert_own" ON availability_blocks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blocks_update_own" ON availability_blocks;
CREATE POLICY "blocks_update_own" ON availability_blocks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blocks_delete_own" ON availability_blocks;
CREATE POLICY "blocks_delete_own" ON availability_blocks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ JOB POSTS ============
CREATE TABLE IF NOT EXISTS job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id),
  location text,
  job_date date NOT NULL,
  start_time time,
  end_time time,
  budget_from int,
  budget_to int,
  required_experience text,
  requirements text,
  travel_required boolean NOT NULL DEFAULT false,
  attachments text[] DEFAULT '{}',
  application_deadline date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','booked','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select_all" ON job_posts;
CREATE POLICY "jobs_select_all" ON job_posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "jobs_insert_own" ON job_posts;
CREATE POLICY "jobs_insert_own" ON job_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "jobs_update_own" ON job_posts;
CREATE POLICY "jobs_update_own" ON job_posts FOR UPDATE
  TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "jobs_delete_own" ON job_posts;
CREATE POLICY "jobs_delete_own" ON job_posts FOR DELETE
  TO authenticated USING (auth.uid() = client_id);

-- ============ JOB APPLICATIONS ============
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  proposal text,
  proposed_price int,
  availability_note text,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','shortlisted','accepted','rejected','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, photographer_id)
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_select_related" ON job_applications;
CREATE POLICY "applications_select_related" ON job_applications FOR SELECT
  TO authenticated USING (
    auth.uid() = photographer_id
    OR EXISTS (SELECT 1 FROM job_posts WHERE job_posts.id = job_applications.job_id AND job_posts.client_id = auth.uid())
  );

DROP POLICY IF EXISTS "applications_insert_own" ON job_applications;
CREATE POLICY "applications_insert_own" ON job_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = photographer_id);

DROP POLICY IF EXISTS "applications_update_related" ON job_applications;
CREATE POLICY "applications_update_related" ON job_applications FOR UPDATE
  TO authenticated USING (
    auth.uid() = photographer_id
    OR EXISTS (SELECT 1 FROM job_posts WHERE job_posts.id = job_applications.job_id AND job_posts.client_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = photographer_id
    OR EXISTS (SELECT 1 FROM job_posts WHERE job_posts.id = job_applications.job_id AND job_posts.client_id = auth.uid())
  );

DROP POLICY IF EXISTS "applications_delete_own" ON job_applications;
CREATE POLICY "applications_delete_own" ON job_applications FOR DELETE
  TO authenticated USING (auth.uid() = photographer_id);

-- ============ BOOKINGS ============
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_posts(id) ON DELETE SET NULL,
  availability_id uuid REFERENCES availability(id) ON DELETE SET NULL,
  client_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id uuid REFERENCES job_applications(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  agreed_price int,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending_ack','confirmed','completed','cancelled','no_show')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_participants" ON bookings;
CREATE POLICY "bookings_select_participants" ON bookings FOR SELECT
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = photographer_id);

DROP POLICY IF EXISTS "bookings_insert_participants" ON bookings;
CREATE POLICY "bookings_insert_participants" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id OR auth.uid() = photographer_id);

DROP POLICY IF EXISTS "bookings_update_participants" ON bookings;
CREATE POLICY "bookings_update_participants" ON bookings FOR UPDATE
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = photographer_id);

DROP POLICY IF EXISTS "bookings_delete_participants" ON bookings;
CREATE POLICY "bookings_delete_participants" ON bookings FOR DELETE
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = photographer_id);

-- ============ EQUIPMENT ============
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  model text,
  serial_number text,
  serial_number_public boolean NOT NULL DEFAULT false,
  category text NOT NULL CHECK (category IN ('camera','lens','flash','lighting','tripod','gimbal','drone','audio','studio','background','other')),
  description text,
  condition_rating text NOT NULL DEFAULT 'good' CHECK (condition_rating IN ('new','excellent','good','fair','poor')),
  condition_notes text,
  images text[] DEFAULT '{}',
  condition_photos text[] DEFAULT '{}',
  hourly_price int,
  daily_price int,
  weekly_price int,
  security_deposit int,
  pickup_available boolean NOT NULL DEFAULT true,
  delivery_available boolean NOT NULL DEFAULT false,
  delivery_fee int,
  location text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equipment_select_all" ON equipment;
CREATE POLICY "equipment_select_all" ON equipment FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "equipment_insert_own" ON equipment;
CREATE POLICY "equipment_insert_own" ON equipment FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "equipment_update_own" ON equipment;
CREATE POLICY "equipment_update_own" ON equipment FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "equipment_delete_own" ON equipment;
CREATE POLICY "equipment_delete_own" ON equipment FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- ============ EQUIPMENT AVAILABILITY ============
CREATE TABLE IF NOT EXISTS equipment_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','rented','blocked','maintenance')),
  rental_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE equipment_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equip_avail_select_all" ON equipment_availability;
CREATE POLICY "equip_avail_select_all" ON equipment_availability FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "equip_avail_insert_owner" ON equipment_availability;
CREATE POLICY "equip_avail_insert_owner" ON equipment_availability FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM equipment WHERE equipment.id = equipment_availability.equipment_id AND equipment.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "equip_avail_update_owner" ON equipment_availability;
CREATE POLICY "equip_avail_update_owner" ON equipment_availability FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM equipment WHERE equipment.id = equipment_availability.equipment_id AND equipment.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM equipment WHERE equipment.id = equipment_availability.equipment_id AND equipment.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "equip_avail_delete_owner" ON equipment_availability;
CREATE POLICY "equip_avail_delete_owner" ON equipment_availability FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM equipment WHERE equipment.id = equipment_availability.equipment_id AND equipment.owner_id = auth.uid())
  );

-- ============ RENTAL REQUESTS ============
CREATE TABLE IF NOT EXISTS rental_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  rental_type text NOT NULL CHECK (rental_type IN ('hourly','daily','weekly')),
  total_price int,
  security_deposit int,
  pickup_method text NOT NULL DEFAULT 'pickup' CHECK (pickup_method IN ('pickup','delivery')),
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rentals_select_participants" ON rental_requests;
CREATE POLICY "rentals_select_participants" ON rental_requests FOR SELECT
  TO authenticated USING (auth.uid() = renter_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "rentals_insert_own" ON rental_requests;
CREATE POLICY "rentals_insert_own" ON rental_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = renter_id);

DROP POLICY IF EXISTS "rentals_update_participants" ON rental_requests;
CREATE POLICY "rentals_update_participants" ON rental_requests FOR UPDATE
  TO authenticated USING (auth.uid() = renter_id OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "rentals_delete_own" ON rental_requests;
CREATE POLICY "rentals_delete_own" ON rental_requests FOR DELETE
  TO authenticated USING (auth.uid() = renter_id);

-- ============ MESSAGE THREADS ============
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  related_job_id uuid REFERENCES job_posts(id) ON DELETE SET NULL,
  related_equipment_id uuid REFERENCES equipment(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_1, participant_2)
);

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "threads_select_participants" ON message_threads;
CREATE POLICY "threads_select_participants" ON message_threads FOR SELECT
  TO authenticated USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "threads_insert_participants" ON message_threads;
CREATE POLICY "threads_insert_participants" ON message_threads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "threads_update_participants" ON message_threads;
CREATE POLICY "threads_update_participants" ON message_threads FOR UPDATE
  TO authenticated USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "threads_delete_participants" ON message_threads;
CREATE POLICY "threads_delete_participants" ON message_threads FOR DELETE
  TO authenticated USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participants" ON messages;
CREATE POLICY "messages_select_participants" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND (message_threads.participant_1 = auth.uid() OR message_threads.participant_2 = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND (message_threads.participant_1 = auth.uid() OR message_threads.participant_2 = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update_participants" ON messages;
CREATE POLICY "messages_update_participants" ON messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND (message_threads.participant_1 = auth.uid() OR message_threads.participant_2 = auth.uid())
    )
  );

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ NOTIFICATION PREFERENCES ============
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  email_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs_select_own" ON notification_preferences;
CREATE POLICY "notif_prefs_select_own" ON notification_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_prefs_insert_own" ON notification_preferences;
CREATE POLICY "notif_prefs_insert_own" ON notification_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_prefs_update_own" ON notification_preferences;
CREATE POLICY "notif_prefs_update_own" ON notification_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('monthly','yearly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','pending')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subs_select_own" ON subscriptions;
CREATE POLICY "subs_select_own" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subs_insert_own" ON subscriptions;
CREATE POLICY "subs_insert_own" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subs_update_own" ON subscriptions;
CREATE POLICY "subs_update_own" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ SUBSCRIPTION TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount int NOT NULL,
  plan text NOT NULL,
  payment_id text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','completed','failed','refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_txns_select_own" ON subscription_transactions;
CREATE POLICY "sub_txns_select_own" ON subscription_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sub_txns_insert_own" ON subscription_transactions;
CREATE POLICY "sub_txns_insert_own" ON subscription_transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ ADVERTISEMENTS ============
CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'platform' CHECK (type IN ('platform','user','sponsor','google')),
  placement text NOT NULL DEFAULT 'fullscreen' CHECK (placement IN ('fullscreen','banner','sponsored')),
  title text NOT NULL,
  description text,
  brand_name text,
  media_url text,
  target_url text,
  sponsored_label text,
  duration_seconds int,
  start_date timestamptz,
  end_date timestamptz,
  region text,
  category text,
  priority int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','payment_pending','paid','under_review','published','paused','expired','rejected')),
  impressions int NOT NULL DEFAULT 0,
  clicks int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ads_select_published" ON advertisements;
CREATE POLICY "ads_select_published" ON advertisements FOR SELECT
  TO authenticated USING (
    status = 'published'
    OR auth.uid() = advertiser_id
  );

DROP POLICY IF EXISTS "ads_insert_own" ON advertisements;
CREATE POLICY "ads_insert_own" ON advertisements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = advertiser_id);

DROP POLICY IF EXISTS "ads_update_own" ON advertisements;
CREATE POLICY "ads_update_own" ON advertisements FOR UPDATE
  TO authenticated USING (auth.uid() = advertiser_id) WITH CHECK (auth.uid() = advertiser_id);

DROP POLICY IF EXISTS "ads_delete_own" ON advertisements;
CREATE POLICY "ads_delete_own" ON advertisements FOR DELETE
  TO authenticated USING (auth.uid() = advertiser_id);

-- ============ AD IMPRESSIONS ============
CREATE TABLE IF NOT EXISTS ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'impression' CHECK (type IN ('impression','click')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_imp_insert_own" ON ad_impressions;
CREATE POLICY "ad_imp_insert_own" ON ad_impressions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  rental_id uuid REFERENCES rental_requests(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  review_type text NOT NULL CHECK (review_type IN ('photographer','client','equipment_owner','renter')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reviewer_id, booking_id),
  UNIQUE (reviewer_id, rental_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = reviewer_id);

-- ============ REPORTS ============
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('user','photographer','job','equipment','portfolio','message','advertisement','review')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam','fraud','fake_profile','misleading_info','harassment','inappropriate_content','payment_issue','duplicate','other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own" ON reports;
CREATE POLICY "reports_select_own" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- ============ SERVICE REGIONS ============
CREATE TABLE IF NOT EXISTS service_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  region_type text NOT NULL CHECK (region_type IN ('city','district','state','radius','pan_india')),
  city text,
  district text,
  state text,
  radius_km int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE service_regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regions_select_all" ON service_regions;
CREATE POLICY "regions_select_all" ON service_regions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "regions_insert_own" ON service_regions;
CREATE POLICY "regions_insert_own" ON service_regions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "regions_update_own" ON service_regions;
CREATE POLICY "regions_update_own" ON service_regions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "regions_delete_own" ON service_regions;
CREATE POLICY "regions_delete_own" ON service_regions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON job_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON job_posts(job_date);
CREATE INDEX IF NOT EXISTS idx_apps_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_photographer ON job_applications(photographer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_photographer ON bookings(photographer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_equipment_owner ON equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_rentals_equipment ON rental_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_rentals_renter ON rental_requests(renter_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_albums_user ON portfolio_albums(user_id);
CREATE INDEX IF NOT EXISTS idx_items_album ON portfolio_items(album_id);
CREATE INDEX IF NOT EXISTS idx_avail_user ON availability(user_id);
CREATE INDEX IF NOT EXISTS idx_avail_date ON availability(available_date);
CREATE INDEX IF NOT EXISTS idx_ads_status ON advertisements(status);

-- ============ TRIGGERS ============
DROP TRIGGER IF EXISTS photo_profiles_updated_at ON photographer_profiles;
CREATE TRIGGER photo_profiles_updated_at BEFORE UPDATE ON photographer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS jobs_updated_at ON job_posts;
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON job_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS equipment_updated_at ON equipment;
CREATE TRIGGER equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS rentals_updated_at ON rental_requests;
CREATE TRIGGER rentals_updated_at BEFORE UPDATE ON rental_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ads_updated_at ON advertisements;
CREATE TRIGGER ads_updated_at BEFORE UPDATE ON advertisements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS notif_prefs_updated_at ON notification_preferences;
CREATE TRIGGER notif_prefs_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
