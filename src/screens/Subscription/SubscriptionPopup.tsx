import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Check, X, Crown } from "lucide-react";

interface SubscriptionPopupProps {
  onDismiss: () => void;
}

export function SubscriptionPopup({ onDismiss }: SubscriptionPopupProps) {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    supabase
      .from("system_settings")
      .select("key, value")
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((s: any) => { map[s.key] = s.value; });
          setSettings(map);
        }
        setLoading(false);
      });
  }, []);

  const monthlyPrice = parseInt(settings.subscription_monthly_price || "0");
  const yearlyPrice = parseInt(settings.subscription_yearly_price || "0");
  const freeMonths = parseInt(settings.subscription_yearly_free_months || "0");
  const isActive = settings.subscription_active === "true";

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    if (!profile) return;
    setSubscribing(true);
    // In production: redirect to Razorpay payment flow
    // For MVP: create subscription record directly (payment verification would be server-side)
    const endDate = new Date();
    if (plan === "monthly") endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    await supabase.from("subscriptions").insert({
      user_id: profile.id,
      plan,
      status: "active",
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
    });
    setSubscribing(false);
    onDismiss();
  };

  if (loading) return <div className="pt-20 text-center text-sm text-[#63636b]">Loading...</div>;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-[#1a1a2e]" />
            <h2 className="text-lg font-bold text-[#131315]">Subscribe</h2>
          </div>
          <button onClick={onDismiss} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f6f2]">
            <X size={18} className="text-[#63636b]" />
          </button>
        </div>

        <p className="mt-2 text-sm text-[#63636b]">
          Get an ad-free experience and unlock all features.
        </p>

        {/* Monthly plan */}
        <div className="mt-5 rounded-2xl border-2 border-[#f8f6f2] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#131315]">Monthly</p>
              <p className="mt-1 text-2xl font-bold text-[#1a1a2e]">₹{monthlyPrice}<span className="text-sm font-normal text-[#63636b]">/month</span></p>
            </div>
            <Button
              onClick={() => handleSubscribe("monthly")}
              disabled={subscribing || !isActive}
              className="h-10 rounded-[14px] bg-[#1a1a2e] px-6 text-sm text-white hover:bg-[#2a2a4e]"
            >
              Subscribe
            </Button>
          </div>
        </div>

        {/* Yearly plan */}
        <div className="mt-3 rounded-2xl border-2 border-[#1a1a2e] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#131315]">Yearly</p>
                {freeMonths > 0 && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                    {freeMonths} MONTHS FREE
                  </span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold text-[#1a1a2e]">₹{yearlyPrice}<span className="text-sm font-normal text-[#63636b]">/year</span></p>
            </div>
            <Button
              onClick={() => handleSubscribe("yearly")}
              disabled={subscribing || !isActive}
              className="h-10 rounded-[14px] bg-[#1a1a2e] px-6 text-sm text-white hover:bg-[#2a2a4e]"
            >
              Subscribe
            </Button>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase text-[#9ca3af]">Benefits</p>
          {["No advertisements", "Full access to all features", "Priority support"].map((b) => (
            <div key={b} className="flex items-center gap-2">
              <Check size={16} className="text-green-600" />
              <span className="text-sm text-[#131315]">{b}</span>
            </div>
          ))}
        </div>

        <button onClick={onDismiss} className="mt-5 w-full py-2 text-center text-sm text-[#63636b]">
          Maybe Later
        </button>
      </div>
    </div>
  );
}
