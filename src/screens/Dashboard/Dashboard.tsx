import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { CAPABILITY_LABELS, type JobPost, type Booking, type Equipment } from "../../types";
import { Briefcase, Calendar, Camera, Package, TrendingUp, Star, Eye, Bell } from "lucide-react";

interface DashboardProps {
  onNavigateJob?: (id: string) => void;
  onNavigateEquipment?: (id: string) => void;
}

export function Dashboard({ onNavigateJob, onNavigateEquipment }: DashboardProps = {}) {
  const { profile, capabilities } = useAuth();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const promises: Promise<void>[] = [];

      // Jobs posted by user
      if (capabilities.includes("post_jobs")) {
        promises.push(
          supabase
            .from("job_posts")
            .select("*")
            .eq("client_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(5)
            .then(({ data }) => { if (data) setJobs(data as JobPost[]); }) as Promise<void>
        );
      }

      // Bookings
      promises.push(
        supabase
          .from("bookings")
          .select("*")
          .or(`client_id.eq.${profile.id},photographer_id.eq.${profile.id}`)
          .order("booking_date", { ascending: false })
          .limit(5)
          .then(({ data }) => { if (data) setBookings(data as Booking[]); }) as Promise<void>
      );

      // Equipment
      if (capabilities.includes("rent_out_equipment")) {
        promises.push(
          supabase
            .from("equipment")
            .select("*")
            .eq("owner_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(5)
            .then(({ data }) => { if (data) setEquipment(data as Equipment[]); }) as Promise<void>
        );
      }

      // Applications count
      if (capabilities.includes("find_jobs")) {
        promises.push(
          supabase
            .from("job_applications")
            .select("id", { count: "exact" })
            .eq("photographer_id", profile.id)
            .eq("status", "pending")
            .then(({ count }) => { setAppliedCount(count || 0); }) as Promise<void>
        );
      }

      // Unread notifications
      promises.push(
        supabase
          .from("notifications")
          .select("id", { count: "exact" })
          .eq("user_id", profile.id)
          .is("read_at", null)
          .then(({ count }) => { setUnreadNotifs(count || 0); }) as Promise<void>
      );

      await Promise.all(promises);
      setLoading(false);
    })();
  }, [profile, capabilities]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <p className="text-sm text-[#63636b]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#63636b]">Welcome back</p>
          <h1 className="mt-0.5 text-xl font-bold text-[#131315]">{profile?.name || "User"}</h1>
        </div>
        <div className="relative">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <Bell size={20} className="text-[#63636b]" />
          </button>
          {unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadNotifs}
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
            <div
              className="h-full rounded-full bg-[#1a1a2e] transition-all"
              style={{ width: `${profile.profile_completion}%` }}
            />
          </div>
        </div>
      )}

      {/* Capabilities */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Your Capabilities</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {capabilities.length === 0 ? (
            <p className="text-sm text-[#63636b]">No capabilities selected yet.</p>
          ) : (
            capabilities.map((cap) => (
              <span key={cap} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#131315]">
                {CAPABILITY_LABELS[cap]}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {capabilities.includes("post_jobs") && (
          <DashboardCard
            icon={<Briefcase size={20} />}
            label="My Jobs"
            count={jobs.length}
            emptyText="No jobs posted"
            ctaText="Post your first job"
          />
        )}
        {capabilities.includes("find_jobs") && (
          <DashboardCard
            icon={<TrendingUp size={20} />}
            label="Jobs Applied"
            count={appliedCount}
            emptyText="No applications"
            ctaText="Browse jobs"
          />
        )}
        <DashboardCard
          icon={<Calendar size={20} />}
          label="Upcoming Bookings"
          count={bookings.filter((b) => b.status === "confirmed").length}
          emptyText="No bookings"
          ctaText="View bookings"
        />
        {capabilities.includes("rent_out_equipment") && (
          <DashboardCard
            icon={<Package size={20} />}
            label="My Equipment"
            count={equipment.length}
            emptyText="No equipment listed"
            ctaText="Add your first equipment"
          />
        )}
        {capabilities.includes("offer_services") && (
          <DashboardCard
            icon={<Camera size={20} />}
            label="Portfolio"
            count={0}
            emptyText="No portfolio yet"
            ctaText="Upload portfolio"
          />
        )}
        <DashboardCard
          icon={<Star size={20} />}
          label="Reviews"
          count={0}
          emptyText="No reviews yet"
          ctaText=""
        />
        <DashboardCard
          icon={<Eye size={20} />}
          label="Profile Views"
          count={0}
          emptyText="No views yet"
          ctaText=""
        />
      </div>

      {/* Recent Jobs */}
      {jobs.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Recent Jobs</p>
          <div className="mt-2 space-y-2">
            {jobs.slice(0, 3).map((job) => (
              <div key={job.id} className="cursor-pointer rounded-2xl bg-white p-4" onClick={() => onNavigateJob?.(job.id)}>
                <p className="text-sm font-semibold text-[#131315]">{job.title}</p>
                <p className="mt-1 text-xs text-[#63636b]">
                  {job.location || "No location"} • {new Date(job.job_date).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    job.status === "open" ? "bg-green-100 text-green-700" :
                    job.status === "booked" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {job.status}
                  </span>
                  {job.budget_from && job.budget_to && (
                    <span className="text-xs text-[#63636b]">₹{job.budget_from} - ₹{job.budget_to}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardCard({
  icon,
  label,
  count,
  emptyText,
  ctaText,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  emptyText: string;
  ctaText: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8f6f2] text-[#1a1a2e]">
          {icon}
        </div>
        <span className="text-lg font-bold text-[#131315]">{count}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-[#131315]">{label}</p>
      {count === 0 && emptyText && (
        <p className="mt-0.5 text-xs text-[#9ca3af]">{emptyText}</p>
      )}
      {count === 0 && ctaText && (
        <p className="mt-1 text-xs font-medium text-[#1a1a2e]">{ctaText}</p>
      )}
    </div>
  );
}
