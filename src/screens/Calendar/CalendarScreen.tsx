import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";

type CalView = "month" | "week" | "day";

interface CalendarItem {
  date: string;
  type: "availability" | "booking" | "rental" | "blocked";
  status: string;
  title: string;
}

export function CalendarScreen() {
  const { profile } = useAuth();
  const [view, setView] = useState<CalView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<Map<string, CalendarItem[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadCalendarItems();
  }, [profile, currentDate]);

  const loadCalendarItems = async () => {
    if (!profile) return;
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString().split("T")[0];
    const end = new Date(year, month + 1, 0).toISOString().split("T")[0];

    const itemMap = new Map<string, CalendarItem[]>();

    // Load availability
    const { data: avail } = await supabase
      .from("availability")
      .select("*")
      .eq("user_id", profile.id)
      .gte("available_date", start)
      .lte("available_date", end);
    if (avail) {
      avail.forEach((a: any) => {
        const key = a.available_date;
        if (!itemMap.has(key)) itemMap.set(key, []);
        itemMap.get(key)!.push({ date: key, type: "availability", status: a.status, title: "Available" });
      });
    }

    // Load bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .or(`client_id.eq.${profile.id},photographer_id.eq.${profile.id}`)
      .gte("booking_date", start)
      .lte("booking_date", end);
    if (bookings) {
      bookings.forEach((b: any) => {
        const key = b.booking_date;
        if (!itemMap.has(key)) itemMap.set(key, []);
        itemMap.get(key)!.push({ date: key, type: "booking", status: b.status, title: "Booking" });
      });
    }

    // Load rental requests
    const { data: rentals } = await supabase
      .from("rental_requests")
      .select("*")
      .or(`renter_id.eq.${profile.id},owner_id.eq.${profile.id}`)
      .eq("status", "accepted")
      .gte("start_date", start)
      .lte("start_date", end);
    if (rentals) {
      rentals.forEach((r: any) => {
        const key = r.start_date;
        if (!itemMap.has(key)) itemMap.set(key, []);
        itemMap.get(key)!.push({ date: key, type: "rental", status: r.status, title: "Rental" });
      });
    }

    // Load blocked dates
    const { data: blocks } = await supabase
      .from("availability_blocks")
      .select("*")
      .eq("user_id", profile.id)
      .gte("block_date", start)
      .lte("block_date", end);
    if (blocks) {
      blocks.forEach((b: any) => {
        const key = b.block_date;
        if (!itemMap.has(key)) itemMap.set(key, []);
        itemMap.get(key)!.push({ date: key, type: "blocked", status: "blocked", title: b.reason || "Unavailable" });
      });
    }

    setItems(itemMap);
    setLoading(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getStatusColor = (items: CalendarItem[] | undefined) => {
    if (!items || items.length === 0) return "";
    if (items.some((i) => i.type === "blocked")) return "bg-gray-400";
    if (items.some((i) => i.type === "booking" && i.status === "confirmed")) return "bg-blue-500";
    if (items.some((i) => i.type === "rental")) return "bg-purple-500";
    if (items.some((i) => i.type === "availability")) return "bg-green-500";
    return "bg-amber-400";
  };

  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split("T")[0];

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div>
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase text-[#9ca3af]">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayItems = items.get(dateStr);
            const isToday = dateStr === today;
            return (
              <div key={i} className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                  isToday ? "bg-[#1a1a2e] font-bold text-white" : "text-[#131315]"
                }`}>
                  {day}
                </div>
                {dayItems && dayItems.length > 0 && (
                  <div className={`mt-0.5 h-1.5 w-1.5 rounded-full ${getStatusColor(dayItems)}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-3">
          <LegendItem color="bg-green-500" label="Available" />
          <LegendItem color="bg-blue-500" label="Confirmed" />
          <LegendItem color="bg-purple-500" label="Rental" />
          <LegendItem color="bg-amber-400" label="Pending" />
          <LegendItem color="bg-gray-400" label="Blocked" />
        </div>

        {/* Today's items */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase text-[#9ca3af]">Events on selected date</p>
          <div className="mt-2 space-y-2">
            {Array.from(items.entries()).map(([date, dayItems]) => (
              dayItems.map((item, idx) => (
                <div key={`${date}-${idx}`} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor([item])}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#131315]">{item.title}</p>
                    <p className="text-xs text-[#63636b]">{new Date(date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs capitalize text-[#63636b]">{item.type}</span>
                </div>
              ))
            ))}
            {items.size === 0 && (
              <p className="rounded-2xl bg-white p-4 text-center text-sm text-[#63636b]">No events this month</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#131315]">Calendar</h1>
        <div className="flex gap-1">
          {(["month", "week", "day"] as CalView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                view === v ? "bg-[#1a1a2e] text-white" : "bg-white text-[#63636b]"
              }`}
            >{v}</button>
          ))}
        </div>
      </div>

      {/* Month navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <ChevronLeft size={18} className="text-[#131315]" />
        </button>
        <p className="text-sm font-semibold text-[#131315]">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </p>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <ChevronRight size={18} className="text-[#131315]" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="mt-4">
        {loading ? <p className="text-sm text-[#63636b]">Loading...</p> : renderMonth()}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs text-[#63636b]">{label}</span>
    </div>
  );
}
