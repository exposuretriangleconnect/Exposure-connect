import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginScreen } from "./screens/Login/LoginScreen";
import { OtpScreen } from "./screens/Login/OtpScreen";
import { Onboarding } from "./screens/Onboarding/Onboarding";
import { AppShell } from "./screens/AppShell/AppShell";
import { SubscriptionPopup } from "./screens/Subscription/SubscriptionPopup";
import { FullScreenAd } from "./screens/Ads/FullScreenAd";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import type { Subscription } from "./types";

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [otpPhone, setOtpPhone] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>(undefined);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showSubPopup, setShowSubPopup] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adChecked, setAdChecked] = useState(false);

  // Check subscription status when profile loads
  useEffect(() => {
    if (!profile || !session) return;
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", profile.id)
        .eq("status", "active")
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && new Date(data.end_date) > new Date()) {
        setSubscription(data as Subscription);
        setShowSubPopup(false);
        setShowAd(false);
      } else {
        setSubscription(null);
        setShowSubPopup(true);
      }
      setAdChecked(true);
    })();
  }, [profile, session]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
        <p className="text-sm text-[#63636b]">Loading...</p>
      </div>
    );
  }

  // Not authenticated: show login flow
  if (!session) {
    if (otpPhone) {
      return (
        <OtpScreen
          phone={otpPhone}
          devCode={devCode}
          onBack={() => { setOtpPhone(null); setDevCode(undefined); }}
        />
      );
    }
    return (
      <LoginScreen
        onOtpSent={(phone, code) => { setOtpPhone(phone); setDevCode(code); }}
      />
    );
  }

  // Authenticated but no profile or onboarding not completed
  if (profile && !profile.onboarding_completed) {
    return <Onboarding onComplete={() => {}} />;
  }

  // Authenticated and onboarded
  return (
    <>
      <AppShell />
      {adChecked && !subscription && showSubPopup && (
        <SubscriptionPopup onDismiss={() => setShowSubPopup(false)} />
      )}
      {adChecked && !subscription && showAd && (
        <FullScreenAd onClose={() => setShowAd(false)} />
      )}
    </>
  );
}

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </StrictMode>,
);
