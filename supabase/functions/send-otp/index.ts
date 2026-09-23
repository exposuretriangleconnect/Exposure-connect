import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Valid phone number required (e.g. +911234567890)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limiting: check recent OTP requests
    const { data: recentOtps } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentOtps && recentOtps.length > 0) {
      const lastCreated = new Date(recentOtps[0].created_at).getTime();
      const cooldownMs = 30 * 1000;
      if (Date.now() - lastCreated < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - (Date.now() - lastCreated)) / 1000);
        return new Response(
          JSON.stringify({ error: `Please wait ${waitSec}s before requesting another OTP` }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Invalidate previous unused OTPs for this phone
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("phone", phone)
      .eq("used", false);

    // Insert new OTP
    const { error } = await supabase
      .from("otp_codes")
      .insert({
        phone,
        code,
        expires_at: expiresAt,
        max_attempts: 5,
      });

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to send OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // In development: return the code so the client can display it
    // In production: send via WhatsApp/SMS provider (abstracted here)
    const isDev = Deno.env.get("DENO_DEPLOYMENT_ID") === undefined;

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully",
        ...(isDev ? { dev_code: code } : {}),
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
