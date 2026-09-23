import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Deterministic password from phone number so the edge function can always sign in a verified user
function phoneToPassword(phone: string): string {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "fallback-secret";
  return phone + "-" + secret.slice(0, 16);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch the latest unused OTP for this phone
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("id, code, expires_at, attempts, max_attempts, used")
      .eq("phone", phone)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: "Verification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ error: "No active OTP found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check expiry
    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      return new Response(
        JSON.stringify({ error: "OTP has expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return new Response(
        JSON.stringify({ error: "Maximum attempts reached. Please request a new OTP." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Increment attempts
    await supabase
      .from("otp_codes")
      .update({ attempts: otpRecord.attempts + 1 })
      .eq("id", otpRecord.id);

    // Verify code
    if (otpRecord.code !== code) {
      const remaining = otpRecord.max_attempts - otpRecord.attempts - 1;
      return new Response(
        JSON.stringify({ error: `Invalid OTP. ${remaining} attempts remaining.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id);

    const fakeEmail = `${phone.replace(/\+/g, "")}@lenswork.app`;
    const password = phoneToPassword(phone);

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, onboarding_completed, is_admin")
      .eq("phone", phone)
      .maybeSingle();

    let isNewUser = false;
    let profileId: string;
    let onboardingCompleted = false;
    let isAdmin = false;

    if (existingProfile) {
      profileId = existingProfile.id;
      onboardingCompleted = existingProfile.onboarding_completed;
      isAdmin = existingProfile.is_admin;
    } else {
      // Create a new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        // User might already exist in auth - try signing in
        const { data: existingAuth } = await supabase.auth.admin.listUsers();
        const found = existingAuth?.users?.find((u: { email: string }) => u.email === fakeEmail);
        if (found) {
          // Reset password
          await supabase.auth.admin.updateUserById(found.id, { password });
          profileId = found.id;
        } else {
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } else {
        profileId = authData.user.id;
      }

      // Create profile
      await supabase
        .from("profiles")
        .insert({
          id: profileId,
          phone,
          onboarding_completed: false,
        });

      isNewUser = true;
    }

    // Sign in and return session tokens
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });

    if (signInError || !signInData.session) {
      return new Response(
        JSON.stringify({ error: "Authentication failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_new_user: isNewUser,
        onboarding_completed: onboardingCompleted,
        is_admin: isAdmin,
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        user_id: profileId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
