export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function sendOtp(phone: string): Promise<{ success: boolean; dev_code?: string; error?: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data.error || "Failed to send OTP" };
  return data;
}

export async function verifyOtp(phone: string, code: string): Promise<{
  success: boolean;
  is_new_user?: boolean;
  onboarding_completed?: boolean;
  is_admin?: boolean;
  access_token?: string;
  refresh_token?: string;
  user_id?: string;
  error?: string;
}> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ phone, code }),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data.error || "Verification failed" };
  return data;
}
