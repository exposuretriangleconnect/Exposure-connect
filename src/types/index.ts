export type Capability =
  | "offer_services"
  | "find_jobs"
  | "hire_photographers"
  | "post_jobs"
  | "rent_equipment"
  | "rent_out_equipment";

export const CAPABILITY_LABELS: Record<Capability, string> = {
  offer_services: "Offer Photography Services",
  find_jobs: "Find Photography Jobs",
  hire_photographers: "Hire Photographers",
  post_jobs: "Post Photography Jobs",
  rent_equipment: "Rent Equipment",
  rent_out_equipment: "Rent Out Equipment",
};

export const CAPABILITY_DESCRIPTIONS: Record<Capability, string> = {
  offer_services: "Offer your photography services to clients",
  find_jobs: "Browse and apply for photography jobs",
  hire_photographers: "Find and hire photographers for your needs",
  post_jobs: "Post photography jobs and hire photographers",
  rent_equipment: "Rent photography equipment from others",
  rent_out_equipment: "List and rent out your own equipment",
};

export interface Profile {
  id: string;
  phone: string;
  name: string | null;
  profile_photo: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  about: string | null;
  verification_status: string;
  profile_completion: number;
  onboarding_completed: boolean;
  upi_qr_code: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCapability {
  id: string;
  user_id: string;
  capability: Capability;
  enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface PhotographerProfile {
  id: string;
  user_id: string;
  experience_years: number | null;
  starting_price: number | null;
  languages: string[];
  is_available: boolean;
  rating: number;
  total_reviews: number;
  completed_jobs: number;
}

export interface PortfolioAlbum {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  location: string | null;
  shoot_date: string | null;
  tags: string[];
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  album_id: string;
  user_id: string;
  type: "photo" | "video";
  media_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  sort_order: number;
}

export interface Availability {
  id: string;
  user_id: string;
  available_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  service_region: string | null;
  category_id: string | null;
  price_from: number | null;
  price_to: number | null;
  travel_available: boolean;
  travel_charges: number | null;
  expiry_date: string | null;
  status: string;
  created_at: string;
}

export interface JobPost {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  location: string | null;
  job_date: string;
  start_time: string | null;
  end_time: string | null;
  budget_from: number | null;
  budget_to: number | null;
  required_experience: string | null;
  requirements: string | null;
  travel_required: boolean;
  attachments: string[];
  application_deadline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  photographer_id: string;
  proposal: string | null;
  proposed_price: number | null;
  availability_note: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  job_id: string | null;
  availability_id: string | null;
  client_id: string;
  photographer_id: string;
  application_id: string | null;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  agreed_price: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface Equipment {
  id: string;
  owner_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  serial_number_public: boolean;
  category: string;
  description: string | null;
  condition_rating: string;
  condition_notes: string | null;
  images: string[];
  condition_photos: string[];
  hourly_price: number | null;
  daily_price: number | null;
  weekly_price: number | null;
  security_deposit: number | null;
  pickup_available: boolean;
  delivery_available: boolean;
  delivery_fee: number | null;
  location: string | null;
  is_available: boolean;
  created_at: string;
}

export interface RentalRequest {
  id: string;
  equipment_id: string;
  renter_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  rental_type: string;
  total_price: number | null;
  security_deposit: number | null;
  pickup_method: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export interface MessageThread {
  id: string;
  participant_1: string;
  participant_2: string;
  related_job_id: string | null;
  related_equipment_id: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  booking_id: string | null;
  rental_id: string | null;
  rating: number;
  review_text: string | null;
  review_type: string;
  created_at: string;
}

export interface SystemSettings {
  subscription_monthly_price: string;
  subscription_yearly_price: string;
  subscription_yearly_free_months: string;
  subscription_active: string;
  ad_default_duration_seconds: string;
  ad_frequency_minutes: string;
  ads_enabled: string;
  paid_ad_price: string;
  otp_expiry_minutes: string;
  otp_max_attempts: string;
  otp_resend_cooldown_seconds: string;
}
