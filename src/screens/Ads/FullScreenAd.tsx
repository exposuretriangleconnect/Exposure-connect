import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { X, ExternalLink } from "lucide-react";

interface FullScreenAdProps {
  onClose: () => void;
}

export function FullScreenAd({ onClose }: FullScreenAdProps) {
  const { profile } = useAuth();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAd();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from("system_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
    }
  };

  const loadAd = async () => {
    const { data } = await supabase
      .from("advertisements")
      .select("*")
      .eq("status", "published")
      .eq("placement", "fullscreen")
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setAd(data);
      const duration = data.duration_seconds || 30;
      setCountdown(duration);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (countdown <= 0 || !ad) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, ad]);

  // Record impression
  useEffect(() => {
    if (ad && profile) {
      supabase.from("ad_impressions").insert({
        ad_id: ad.id,
        user_id: profile.id,
        type: "impression",
      });
    }
  }, [ad, profile]);

  if (loading) return null;
  if (!ad) {
    onClose();
    return null;
  }

  const canClose = countdown <= 0;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black">
      {/* Media */}
      <div className="relative flex-1">
        {ad.media_url ? (
          ad.media_url.endsWith(".mp4") || ad.media_url.endsWith(".webm") ? (
            <video src={ad.media_url} autoPlay muted loop className="h-full w-full object-cover" />
          ) : (
            <img src={ad.media_url} alt={ad.title} className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e]">
            <p className="text-2xl font-bold text-white">{ad.brand_name || ad.title}</p>
          </div>
        )}

        {/* Sponsored label */}
        <div className="absolute top-4 left-4 rounded-full bg-black/50 px-3 py-1">
          <span className="text-xs font-medium text-white">Sponsored</span>
        </div>

        {/* Close button */}
        <button
          onClick={canClose ? onClose : undefined}
          disabled={!canClose}
          className={`absolute top-4 right-4 flex h-10 items-center gap-2 rounded-full px-4 ${
            canClose ? "bg-white/90" : "bg-black/50"
          }`}
        >
          {canClose ? (
            <X size={18} className="text-black" />
          ) : (
            <span className="text-sm font-medium text-white">{countdown}s</span>
          )}
        </button>
      </div>

      {/* Ad info */}
      <div className="bg-white px-5 py-6">
        <p className="text-lg font-bold text-[#131315]">{ad.brand_name || ad.title}</p>
        {ad.description && <p className="mt-1 text-sm text-[#63636b]">{ad.description}</p>}
        {ad.target_url && (
          <a
            href={ad.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#1a1a2e] text-sm text-white"
          >
            Learn More <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
}
