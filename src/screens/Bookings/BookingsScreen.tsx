import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import type { Booking } from "../../types";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

export function BookingsScreen() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("bookings")
      .select("*")
      .or(`client_id.eq.${profile.id},photographer_id.eq.${profile.id}`)
      .order("booking_date", { ascending: false })
      .then(({ data }) => {
        if (data) setBookings(data as Booking[]);
        setLoading(false);
      });
  }, [profile]);

  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return b.status === "confirmed" || b.status === "pending_ack";
    if (filter === "completed") return b.status === "completed";
    if (filter === "cancelled") return b.status === "cancelled";
    return true;
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle size={16} className="text-green-600" />;
      case "pending_ack": return <Clock size={16} className="text-amber-500" />;
      case "cancelled": return <XCircle size={16} className="text-red-500" />;
      case "completed": return <CheckCircle size={16} className="text-blue-500" />;
      default: return <Calendar size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="px-5 pt-12">
      <h1 className="text-xl font-bold text-[#131315]">Bookings</h1>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-2">
        {(["all", "upcoming", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
              filter === f ? "bg-[#1a1a2e] text-white" : "bg-white text-[#63636b]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <div className="mt-4 space-y-3 pb-4">
        {loading && <p className="text-sm text-[#63636b]">Loading...</p>}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center">
            <Calendar size={32} className="mx-auto text-[#9ca3af]" />
            <p className="mt-3 text-sm text-[#63636b]">No bookings yet</p>
          </div>
        )}
        {filtered.map((booking) => (
          <div key={booking.id} className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {statusIcon(booking.status)}
                <span className="text-sm font-semibold capitalize text-[#131315]">
                  {booking.status.replace("_", " ")}
                </span>
              </div>
              <span className="text-xs text-[#63636b]">
                {new Date(booking.booking_date).toLocaleDateString()}
              </span>
            </div>
            {booking.location && (
              <p className="mt-2 text-xs text-[#63636b]">{booking.location}</p>
            )}
            {booking.agreed_price && (
              <p className="mt-1 text-sm font-medium text-[#1a1a2e]">₹{booking.agreed_price}</p>
            )}
            {booking.notes && (
              <p className="mt-2 text-xs text-[#63636b]">{booking.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
