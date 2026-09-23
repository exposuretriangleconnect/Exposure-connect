import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  CAPABILITY_LABELS,
  type Capability,
  type Subscription,
  type AppNotification,
} from "../../types";
import { Camera, Settings, Bell, LogOut, ChevronRight, Star, Shield, Package, Briefcase } from "lucide-react";

const ALL_CAPABILITIES: Capability[] = [
  "offer_services",
  "find_jobs",
  "hire_photographers",
  "post_jobs",
  "rent_equipment",
  "rent_out_equipment",
];

export function ProfileScreen() {
  const { profile, capabilities, signOut, refreshProfile, refreshCapabilities } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCaps, setShowCaps] = useState(false);
  const [pendingCaps, setPendingCaps] = useState<Set<Capability>>(new Set(capabilities));
  const [savingCaps, setSavingCaps] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setSubscription(data as Subscription); });

    supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", profile.id)
      .is("read_at", null)
      .then(({ count }) => setUnreadCount(count || 0));
  }, [profile]);

  const toggleCap = (cap: Capability) => {
    const next = new Set(pendingCaps);
    if (next.has(cap)) next.delete(cap);
    else next.add(cap);
    setPendingCaps(next);
  };

  const saveCapabilities = async () => {
    if (!profile) return;
    setSavingCaps(true);
    const allRows = ALL_CAPABILITIES.map((cap) => ({
      user_id: profile.id,
      capability: cap,
      enabled: pendingCaps.has(cap),
    }));
    await supabase
      .from("user_capabilities")
      .upsert(allRows, { onConflict: "user_id,capability" });
    await refreshCapabilities();
    setSavingCaps(false);
    setShowCaps(false);
  };

  return (
    <div className="px-5 pt-12 pb-4">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        {profile?.profile_photo ? (
          <img src={profile.profile_photo} alt={profile.name || ""} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <Camera size={24} className="text-[#9ca3af]" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#131315]">{profile?.name || "User"}</h1>
            {profile?.verification_status === "verified" && (
              <Shield size={14} className="text-green-600" />
            )}
          </div>
          <p className="mt-0.5 text-sm text-[#63636b]">
            {profile?.city ? `${profile.city}, ${profile.state || ""}` : "Location not set"}
          </p>
          {profile && (
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
              profile.verification_status === "verified" ? "bg-green-100 text-green-700" :
              profile.verification_status === "pending" ? "bg-amber-100 text-amber-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {profile.verification_status}
            </span>
          )}
        </div>
      </div>

      {/* Profile completion */}
      {profile && profile.profile_completion < 100 && (
        <div className="mt-4 rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#131315]">Profile Completion</p>
            <p className="text-sm font-bold text-[#1a1a2e]">{profile.profile_completion}%</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-[#1a1a2e]" style={{ width: `${profile.profile_completion}%` }} />
          </div>
        </div>
      )}

      {/* Subscription status */}
      <div className="mt-4 rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#131315]">Subscription</p>
            <p className="mt-0.5 text-xs text-[#63636b]">
              {subscription ? `Active until ${new Date(subscription.end_date).toLocaleDateString()}` : "Not subscribed"}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            subscription ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}>
            {subscription ? subscription.plan : "Free"}
          </span>
        </div>
      </div>

      {/* Capabilities */}
      <div className="mt-4">
        <button
          onClick={() => setShowCaps(!showCaps)}
          className="flex w-full items-center justify-between rounded-2xl bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-[#63636b]" />
            <span className="text-sm font-medium text-[#131315]">My Capabilities</span>
          </div>
          <ChevronRight size={18} className={`text-[#9ca3af] transition-transform ${showCaps ? "rotate-90" : ""}`} />
        </button>
        {showCaps && (
          <div className="mt-2 space-y-2 rounded-2xl bg-white p-4">
            {ALL_CAPABILITIES.map((cap) => (
              <button
                key={cap}
                onClick={() => toggleCap(cap)}
                className="flex w-full items-center justify-between py-2"
              >
                <span className="text-sm text-[#131315]">{CAPABILITY_LABELS[cap]}</span>
                <div className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                  pendingCaps.has(cap) ? "bg-[#1a1a2e]" : "bg-gray-300"
                }`}>
                  <div className={`h-5 w-5 rounded-full bg-white transition-transform ${
                    pendingCaps.has(cap) ? "translate-x-5" : ""
                  }`} />
                </div>
              </button>
            ))}
            <button
              onClick={saveCapabilities}
              disabled={savingCaps}
              className="mt-3 h-10 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white"
            >
              {savingCaps ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="mt-4 space-y-2">
        <MenuItem icon={<Bell size={20} />} label="Notifications" badge={unreadCount > 0 ? unreadCount : undefined} />
        <MenuItem icon={<Star size={20} />} label="Reviews" />
        <MenuItem icon={<Briefcase size={20} />} label="My Reports" />
        <MenuItem icon={<Package size={20} />} label="My Equipment" />
        <MenuItem icon={<Camera size={20} />} label="My Portfolio" />
      </div>

      {/* P2P Payment disclaimer */}
      <div className="mt-4 rounded-2xl bg-amber-50 p-4">
        <p className="text-xs leading-relaxed text-amber-700">
          Payments between users are external transactions and are not processed, held, settled, or guaranteed by the platform.
        </p>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-white p-4"
      >
        <LogOut size={20} className="text-red-500" />
        <span className="text-sm font-medium text-red-500">Sign Out</span>
      </button>
    </div>
  );
}

function MenuItem({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button className="flex w-full items-center justify-between rounded-2xl bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="text-[#63636b]">{icon}</span>
        <span className="text-sm font-medium text-[#131315]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
        <ChevronRight size={18} className="text-[#9ca3af]" />
      </div>
    </button>
  );
}
