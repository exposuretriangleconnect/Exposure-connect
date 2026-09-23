import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import type { JobPost, Equipment, Profile, Category } from "../../types";
import { Search as SearchIcon, Briefcase, Camera, Package, MapPin, Star } from "lucide-react";

type SearchTab = "photographers" | "jobs" | "equipment";

interface SearchScreenProps {
  onJobClick?: (id: string) => void;
  onEquipmentClick?: (id: string) => void;
}

export function SearchScreen({ onJobClick, onEquipmentClick }: SearchScreenProps = {}) {
  const { capabilities } = useAuth();
  const [tab, setTab] = useState<SearchTab>("photographers");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => { if (data) setCategories(data as Category[]); });
  }, []);

  useEffect(() => {
    performSearch();
  }, [tab, selectedCategory]);

  const performSearch = async () => {
    setLoading(true);
    if (tab === "photographers") {
      let q = supabase
        .from("profiles")
        .select(`
          id, name, profile_photo, city, state, about, verification_status,
          photographer_profiles!inner(experience_years, starting_price, rating, completed_jobs, is_available)
        `);
      if (query) q = q.or(`name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`);
      const { data } = await q.limit(20);
      setResults(data || []);
    } else if (tab === "jobs") {
      let q = supabase
        .from("job_posts")
        .select(`
          *,
          categories(name)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (query) q = q.or(`title.ilike.%${query}%,location.ilike.%${query}%`);
      if (selectedCategory) q = q.eq("category_id", selectedCategory);
      const { data } = await q.limit(20);
      setResults(data || []);
    } else if (tab === "equipment") {
      let q = supabase
        .from("equipment")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });
      if (query) q = q.or(`name.ilike.%${query}%,brand.ilike.%${query}%,location.ilike.%${query}%`);
      if (selectedCategory) q = q.eq("category", selectedCategory);
      const { data } = await q.limit(20);
      setResults(data || []);
    }
    setLoading(false);
  };

  const availableTabs: SearchTab[] = ["photographers", "jobs", "equipment"];

  return (
    <div className="px-5 pt-12">
      <h1 className="text-xl font-bold text-[#131315]">Search</h1>

      {/* Search bar */}
      <div className="mt-4 flex h-12 items-center gap-2 rounded-[14px] bg-white px-4">
        <SearchIcon size={18} className="text-[#9ca3af]" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && performSearch()}
          className="h-full flex-1 bg-transparent text-sm text-[#131315] placeholder:text-[#9ca3af] focus:outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-2">
        {availableTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
              tab === t ? "bg-[#1a1a2e] text-white" : "bg-white text-[#63636b]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Category filter */}
      {(tab === "jobs" || tab === "equipment") && categories.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              !selectedCategory ? "bg-[#1a1a2e] text-white" : "bg-white text-[#63636b]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                selectedCategory === cat.id ? "bg-[#1a1a2e] text-white" : "bg-white text-[#63636b]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="mt-4 space-y-3 pb-4">
        {loading && <p className="text-sm text-[#63636b]">Loading...</p>}
        {!loading && results.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center">
            <p className="text-sm text-[#63636b]">No results found</p>
          </div>
        )}

        {/* Photographer results */}
        {tab === "photographers" && results.map((p: any) => (
          <div key={p.id} className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-3">
              {p.profile_photo ? (
                <img src={p.profile_photo} alt={p.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f6f2]">
                  <Camera size={20} className="text-[#9ca3af]" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold text-[#131315]">{p.name || "Unnamed"}</p>
                  {p.verification_status === "verified" && (
                    <span className="text-xs text-green-600">✓</span>
                  )}
                </div>
                {p.city && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[#63636b]">
                    <MapPin size={10} /> {p.city}, {p.state || ""}
                  </p>
                )}
              </div>
            </div>
            {p.photographer_profiles?.[0] && (
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[#63636b]">
                  {p.photographer_profiles[0].experience_years || 0} yrs exp
                </span>
                {p.photographer_profiles[0].starting_price && (
                  <span className="font-medium text-[#1a1a2e]">
                    From ₹{p.photographer_profiles[0].starting_price}
                  </span>
                )}
                {p.photographer_profiles[0].rating > 0 && (
                  <span className="flex items-center gap-1 text-[#63636b]">
                    <Star size={10} /> {p.photographer_profiles[0].rating}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Job results */}
        {tab === "jobs" && results.map((job: any) => (
          <div key={job.id} className="cursor-pointer rounded-2xl bg-white p-4" onClick={() => onJobClick?.(job.id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#131315]">{job.title}</p>
                {job.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#63636b]">
                    <MapPin size={10} /> {job.location}
                  </p>
                )}
              </div>
              {job.categories?.name && (
                <span className="rounded-full bg-[#f8f6f2] px-2 py-0.5 text-[10px] font-medium text-[#63636b]">
                  {job.categories.name}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[#63636b]">
                {new Date(job.job_date).toLocaleDateString()}
              </span>
              {job.budget_from && job.budget_to && (
                <span className="text-sm font-medium text-[#1a1a2e]">
                  ₹{job.budget_from} - ₹{job.budget_to}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Equipment results */}
        {tab === "equipment" && results.map((eq: Equipment) => (
          <div key={eq.id} className="cursor-pointer rounded-2xl bg-white p-4" onClick={() => onEquipmentClick?.(eq.id)}>
            <div className="flex items-start gap-3">
              {eq.images && eq.images.length > 0 ? (
                <img src={eq.images[0]} alt={eq.name} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#f8f6f2]">
                  <Package size={24} className="text-[#9ca3af]" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#131315]">{eq.name}</p>
                {eq.brand && <p className="mt-0.5 text-xs text-[#63636b]">{eq.brand} {eq.model}</p>}
                {eq.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#63636b]">
                    <MapPin size={10} /> {eq.location}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              {eq.daily_price && <span className="font-medium text-[#1a1a2e]">₹{eq.daily_price}/day</span>}
              {eq.hourly_price && <span className="text-[#63636b]">₹{eq.hourly_price}/hr</span>}
              <span className="rounded-full bg-[#f8f6f2] px-2 py-0.5 capitalize text-[#63636b]">{eq.condition_rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
