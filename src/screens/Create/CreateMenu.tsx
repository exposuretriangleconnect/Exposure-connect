import { Briefcase, Calendar, Package, Megaphone, Camera } from "lucide-react";

interface CreateMenuProps {
  options: { label: string; cap: string | null; screen: string }[];
  onNavigate: (screen: string) => void;
}

export function CreateMenu({ options, onNavigate }: CreateMenuProps) {
  const icons: Record<string, React.ReactNode> = {
    "post-job": <Briefcase size={24} />,
    "create-availability": <Calendar size={24} />,
    "add-equipment": <Package size={24} />,
    "create-ad": <Megaphone size={24} />,
    "upload-portfolio": <Camera size={24} />,
  };

  return (
    <div className="px-5 pt-12">
      <h1 className="text-xl font-bold text-[#131315]">Create</h1>
      <p className="mt-1 text-sm text-[#63636b]">What would you like to do?</p>

      <div className="mt-6 space-y-3">
        {options.map((opt) => (
          <button
            key={opt.screen}
            onClick={() => onNavigate(opt.screen)}
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left transition-transform active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f6f2] text-[#1a1a2e]">
              {icons[opt.screen] || <Briefcase size={24} />}
            </div>
            <span className="text-sm font-medium text-[#131315]">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
