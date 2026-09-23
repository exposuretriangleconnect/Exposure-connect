import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  CAPABILITY_LABELS,
  CAPABILITY_DESCRIPTIONS,
  type Capability,
  type Category,
} from "../../types";

const ALL_CAPABILITIES: Capability[] = [
  "offer_services",
  "find_jobs",
  "hire_photographers",
  "post_jobs",
  "rent_equipment",
  "rent_out_equipment",
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { profile, refreshProfile, refreshCapabilities } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic info
  const [name, setName] = useState(profile?.name || "");
  const [city, setCity] = useState(profile?.city || "");
  const [district, setDistrict] = useState(profile?.district || "");
  const [state, setState] = useState(profile?.state || "");
  const [about, setAbout] = useState(profile?.about || "");

  // Step 2: Capabilities
  const [selectedCaps, setSelectedCaps] = useState<Set<Capability>>(new Set());

  // Step 3: Professional info
  const [experienceYears, setExperienceYears] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [languages, setLanguages] = useState("");

  // Step 4: Service regions
  const [serviceCity, setServiceCity] = useState("");
  const [serviceState, setServiceState] = useState("");
  const [serviceRadius, setServiceRadius] = useState("");

  // Step 5: Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const toggleCapability = (cap: Capability) => {
    const next = new Set(selectedCaps);
    if (next.has(cap)) next.delete(cap);
    else next.add(cap);
    setSelectedCaps(next);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (data) setCategories(data as Category[]);
  };

  const handleStep1Next = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await supabase
      .from("profiles")
      .update({ name, city, district, state, about })
      .eq("id", profile!.id);
    setLoading(false);
    setStep(2);
  };

  const handleStep2Next = async () => {
    if (selectedCaps.size === 0) return;
    setLoading(true);
    const rows = Array.from(selectedCaps).map((cap) => ({
      user_id: profile!.id,
      capability: cap,
      enabled: true,
    }));
    await supabase.from("user_capabilities").upsert(rows, { onConflict: "user_id,capability" });
    await refreshCapabilities();
    setLoading(false);
    setStep(3);
  };

  const handleStep3Next = async () => {
    if (selectedCaps.has("offer_services")) {
      setLoading(true);
      await supabase.from("photographer_profiles").upsert({
        user_id: profile!.id,
        experience_years: experienceYears ? parseInt(experienceYears) : null,
        starting_price: startingPrice ? parseInt(startingPrice) : null,
        languages: languages ? languages.split(",").map((l) => l.trim()) : [],
      });
      await loadCategories();
      setLoading(false);
    }
    setStep(4);
  };

  const handleStep4Next = async () => {
    if (serviceCity || serviceState) {
      setLoading(true);
      await supabase.from("service_regions").insert({
        user_id: profile!.id,
        region_type: serviceRadius ? "radius" : "city",
        city: serviceCity || null,
        state: serviceState || null,
        radius_km: serviceRadius ? parseInt(serviceRadius) : null,
      });
      setLoading(false);
    }
    setStep(5);
  };

  const handleFinish = async () => {
    setLoading(true);
    const completion = calculateCompletion();
    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        profile_completion: completion,
      })
      .eq("id", profile!.id);
    await refreshProfile();
    setLoading(false);
    onComplete();
  };

  const calculateCompletion = () => {
    let score = 10;
    if (name) score += 10;
    if (city) score += 10;
    if (state) score += 5;
    if (about) score += 5;
    if (selectedCaps.size > 0) score += 20;
    if (selectedCaps.has("offer_services") && experienceYears) score += 10;
    if (selectedCaps.has("offer_services") && startingPrice) score += 10;
    if (serviceCity || serviceState) score += 10;
    if (selectedCats.size > 0) score += 10;
    return Math.min(score, 100);
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#f8f6f2]">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-[#f8f6f2] px-7 pt-[54px] pb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#1a1a2e]">LENSWORK</p>
          <p className="text-sm text-[#63636b]">{step}/{totalSteps}</p>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[#1a1a2e] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-7 pb-8">
        {step === 1 && (
          <div className="mt-6 animate-fade-up">
            <h2 className="text-2xl font-bold text-[#131315]">Basic Information</h2>
            <p className="mt-2 text-sm text-[#63636b]">Tell us about yourself</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#131315]">Full Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#131315]">City</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#131315]">District</label>
                <Input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. South Mumbai"
                  className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#131315]">State</label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#131315]">About</label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full rounded-[14px] border-0 bg-white px-4 py-3 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus:outline-none"
                />
              </div>
            </div>
            <Button
              onClick={handleStep1Next}
              disabled={loading || !name.trim()}
              className="mt-6 h-12 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white hover:bg-[#2a2a4e]"
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 animate-fade-up">
            <h2 className="text-2xl font-bold text-[#131315]">Select Your Capabilities</h2>
            <p className="mt-2 text-sm text-[#63636b]">Choose all that apply. You can change these later.</p>
            <div className="mt-6 space-y-3">
              {ALL_CAPABILITIES.map((cap) => (
                <button
                  key={cap}
                  onClick={() => toggleCapability(cap)}
                  className={`flex w-full items-start gap-3 rounded-[14px] border-2 p-4 text-left transition-all ${
                    selectedCaps.has(cap)
                      ? "border-[#1a1a2e] bg-white"
                      : "border-transparent bg-white"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      selectedCaps.has(cap) ? "border-[#1a1a2e] bg-[#1a1a2e]" : "border-gray-300"
                    }`}
                  >
                    {selectedCaps.has(cap) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#131315]">{CAPABILITY_LABELS[cap]}</p>
                    <p className="mt-0.5 text-xs text-[#63636b]">{CAPABILITY_DESCRIPTIONS[cap]}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={handleStep2Next}
              disabled={loading || selectedCaps.size === 0}
              className="mt-6 h-12 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white hover:bg-[#2a2a4e]"
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 animate-fade-up">
            <h2 className="text-2xl font-bold text-[#131315]">Professional Information</h2>
            <p className="mt-2 text-sm text-[#63636b]">
              {selectedCaps.has("offer_services")
                ? "Tell clients about your photography experience"
                : "You can skip this step if you're not offering services"}
            </p>
            {selectedCaps.has("offer_services") ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#131315]">Experience (years)</label>
                  <Input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 5"
                    className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#131315]">Starting Price (₹)</label>
                  <Input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    placeholder="e.g. 5000"
                    className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#131315]">Languages (comma separated)</label>
                  <Input
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="e.g. English, Hindi, Marathi"
                    className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[14px] bg-white p-6 text-center">
                <p className="text-sm text-[#63636b]">
                  No professional information needed for your selected capabilities.
                </p>
              </div>
            )}
            <Button
              onClick={handleStep3Next}
              disabled={loading}
              className="mt-6 h-12 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white hover:bg-[#2a2a4e]"
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="mt-6 animate-fade-up">
            <h2 className="text-2xl font-bold text-[#131315]">Service Regions</h2>
            <p className="mt-2 text-sm text-[#63636b]">Where do you offer your services?</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#131315]">City</label>
                <Input
                  value={serviceCity}
                  onChange={(e) => setServiceCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#131315]">State</label>
                <Input
                  value={serviceState}
                  onChange={(e) => setServiceState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#131315]">Service Radius (km)</label>
                <Input
                  type="number"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                  placeholder="e.g. 25"
                  className="h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0"
                />
              </div>
            </div>
            <Button
              onClick={handleStep4Next}
              disabled={loading}
              className="mt-6 h-12 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white hover:bg-[#2a2a4e]"
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="mt-6 animate-fade-up">
            <h2 className="text-2xl font-bold text-[#131315]">Photography Categories</h2>
            <p className="mt-2 text-sm text-[#63636b]">Select your specialties (optional)</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.length === 0 && (
                <button onClick={loadCategories} className="text-sm text-[#1a1a2e] underline">
                  Load categories
                </button>
              )}
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    const next = new Set(selectedCats);
                    if (next.has(cat.id)) next.delete(cat.id);
                    else next.add(cat.id);
                    setSelectedCats(next);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedCats.has(cat.id)
                      ? "bg-[#1a1a2e] text-white"
                      : "bg-white text-[#63636b]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              <Button
                onClick={handleFinish}
                disabled={loading}
                className="h-12 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white hover:bg-[#2a2a4e]"
              >
                {loading ? "Completing..." : "Complete Onboarding"}
                </Button>
              <button
                onClick={handleFinish}
                className="w-full text-center text-sm text-[#63636b]"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
