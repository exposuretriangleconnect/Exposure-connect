import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { AppNotification } from "../../types";
import { Bell, CheckCheck } from "lucide-react";

export function NotificationsScreen() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadNotifications();
  }, [profile]);

  const loadNotifications = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data as AppNotification[]);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", profile.id)
      .is("read_at", null);
    loadNotifications();
  };

  const markRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    loadNotifications();
  };

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#131315]">Notifications</h1>
        {notifications.some((n) => !n.read_at) && (
          <button onClick={markAllRead} className="flex items-center gap-1 text-sm text-[#1a1a2e]">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-[#63636b]">Loading...</p>}
        {!loading && notifications.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center">
            <Bell size={32} className="mx-auto text-[#9ca3af]" />
            <p className="mt-3 text-sm text-[#63636b]">No notifications</p>
          </div>
        )}
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left ${
              n.read_at ? "bg-white" : "bg-white ring-2 ring-[#1a1a2e]/10"
            }`}
          >
            <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-[#1a1a2e]"}`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#131315]">{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs text-[#63636b]">{n.body}</p>}
              <p className="mt-1 text-[10px] text-[#9ca3af]">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
