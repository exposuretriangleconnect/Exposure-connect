import { Home, Search, Plus, Calendar, User, Bell, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Dashboard } from "../Dashboard/Dashboard";
import { SearchScreen } from "../Search/SearchScreen";
import { CreateMenu } from "../Create/CreateMenu";
import { BookingsScreen } from "../Bookings/BookingsScreen";
import { ProfileScreen } from "../Profile/ProfileScreen";
import { CalendarScreen } from "../Calendar/CalendarScreen";
import { MessagesScreen } from "../Messages/MessagesScreen";
import { NotificationsScreen } from "../Notifications/NotificationsScreen";
import { PostJob } from "../Jobs/PostJob";
import { JobDetails } from "../Jobs/JobDetails";
import { AddEquipment } from "../Equipment/AddEquipment";
import { EquipmentDetails } from "../Equipment/EquipmentDetails";
import type { Capability } from "../../types";

type Tab = "home" | "search" | "create" | "bookings" | "profile";
type Overlay =
  | { type: "calendar" }
  | { type: "messages" }
  | { type: "notifications" }
  | { type: "post-job" }
  | { type: "job-details"; jobId: string }
  | { type: "add-equipment" }
  | { type: "equipment-details"; equipmentId: string }
  | null;

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const { capabilities } = useAuth();

  const createOptions: { label: string; cap: Capability | null; screen: string }[] = [
    { label: "Post Photography Job", cap: "post_jobs", screen: "post-job" },
    { label: "Create Availability", cap: "offer_services", screen: "create-availability" },
    { label: "Add Equipment", cap: "rent_out_equipment", screen: "add-equipment" },
    { label: "Create Advertisement", cap: null, screen: "create-ad" },
  ];

  const visibleCreateOptions = createOptions.filter(
    (opt) => opt.cap === null || capabilities.includes(opt.cap),
  );

  const handleCreateNavigate = (screen: string) => {
    if (screen === "post-job") setOverlay({ type: "post-job" });
    else if (screen === "add-equipment") setOverlay({ type: "add-equipment" });
    else setActiveTab("home");
  };

  // Render overlay screens
  if (overlay) {
    switch (overlay.type) {
      case "calendar":
        return <CalendarScreenWrapper onBack={() => setOverlay(null)} />;
      case "messages":
        return <MessagesScreenWrapper onBack={() => setOverlay(null)} />;
      case "notifications":
        return <NotificationsScreenWrapper onBack={() => setOverlay(null)} />;
      case "post-job":
        return <PostJob onDone={() => setOverlay(null)} />;
      case "job-details":
        return <JobDetails jobId={overlay.jobId} onBack={() => setOverlay(null)} />;
      case "add-equipment":
        return <AddEquipment onDone={() => setOverlay(null)} />;
      case "equipment-details":
        return <EquipmentDetails equipmentId={overlay.equipmentId} onBack={() => setOverlay(null)} />;
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f8f6f2]">
      {/* Top action bar */}
      <div className="sticky top-0 z-10 flex items-center justify-end gap-2 bg-[#f8f6f2] px-5 pt-3 pb-1">
        <button
          onClick={() => setOverlay({ type: "notifications" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <Bell size={18} className="text-[#63636b]" />
        </button>
        <button
          onClick={() => setOverlay({ type: "messages" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <MessageSquare size={18} className="text-[#63636b]" />
        </button>
        <button
          onClick={() => setOverlay({ type: "calendar" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <Calendar size={18} className="text-[#63636b]" />
        </button>
      </div>

      <div className="flex-1 pb-20">
        {activeTab === "home" && <Dashboard onNavigateJob={(id) => setOverlay({ type: "job-details", jobId: id })} onNavigateEquipment={(id) => setOverlay({ type: "equipment-details", equipmentId: id })} />}
        {activeTab === "search" && (
          <SearchScreen
            onJobClick={(id) => setOverlay({ type: "job-details", jobId: id })}
            onEquipmentClick={(id) => setOverlay({ type: "equipment-details", equipmentId: id })}
          />
        )}
        {activeTab === "create" && (
          <CreateMenu options={visibleCreateOptions} onNavigate={handleCreateNavigate} />
        )}
        {activeTab === "bookings" && <BookingsScreen />}
        {activeTab === "profile" && <ProfileScreen />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-2 py-2">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <NavButton icon={<Home size={22} />} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
          <NavButton icon={<Search size={22} />} label="Search" active={activeTab === "search"} onClick={() => setActiveTab("search")} />
          <button onClick={() => setActiveTab("create")} className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a2e] shadow-lg transition-transform active:scale-95">
              <Plus size={24} className="text-white" />
            </div>
          </button>
          <NavButton icon={<Calendar size={22} />} label="Bookings" active={activeTab === "bookings"} onClick={() => setActiveTab("bookings")} />
          <NavButton icon={<User size={22} />} label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-2 py-1 transition-colors ${active ? "text-[#1a1a2e]" : "text-[#9ca3af]"}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// Wrapper components for overlay screens with back button
function CalendarScreenWrapper({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <button onClick={onBack} className="absolute top-12 left-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white">
        <span className="text-sm text-[#131315]">←</span>
      </button>
      <CalendarScreen />
    </div>
  );
}

function MessagesScreenWrapper({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <button onClick={onBack} className="absolute top-12 left-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white">
        <span className="text-sm text-[#131315]">←</span>
      </button>
      <MessagesScreen />
    </div>
  );
}

function NotificationsScreenWrapper({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <button onClick={onBack} className="absolute top-12 left-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white">
        <span className="text-sm text-[#131315]">←</span>
      </button>
      <NotificationsScreen />
    </div>
  );
}
