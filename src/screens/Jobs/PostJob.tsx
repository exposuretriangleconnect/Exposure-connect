import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { Category, JobPost } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Calendar, MapPin, IndianRupee, Clock, Briefcase } from "lucide-react";

interface PostJobProps {
  onDone: () => void;
}

export function PostJob({ onDone }: PostJobProps) {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [jobDate, setJobDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");
  const [requiredExperience, setRequiredExperience] = useState("");
  const [requirements, setRequirements] = useState("");
  const [travelRequired, setTravelRequired] = useState(false);
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => { if (data) setCategories(data as Category[]); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !jobDate || !budgetFrom || !budgetTo) {
      setError("Title, date, and budget range are required");
      return;
    }
    setLoading(true);
    const { error: insertError } = await supabase.from("job_posts").insert({
      client_id: profile!.id,
      title,
      description: description || null,
      category_id: categoryId || null,
      location: location || null,
      job_date: jobDate,
      start_time: startTime || null,
      end_time: endTime || null,
      budget_from: parseInt(budgetFrom),
      budget_to: parseInt(budgetTo),
      required_experience: requiredExperience || null,
      requirements: requirements || null,
      travel_required: travelRequired,
      application_deadline: deadline || null,
      status: "open",
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      onDone();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#f8f6f2] px-5 pt-12 pb-3">
        <button onClick={onDone} className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <ArrowLeft size={18} className="text-[#131315]" />
        </button>
        <h1 className="text-lg font-bold text-[#131315]">Post a Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-8">
        <Field label="Job Title *">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wedding Photographer Needed" className={inputCls} />
        </Field>

        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job..." rows={3} className={textareaCls} />
        </Field>

        <Field label="Category">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectCls}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="Location">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai, Maharashtra" className={inputCls} />
        </Field>

        <Field label="Job Date *">
          <Input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Time">
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
          </Field>
          <Field label="End Time">
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget From (₹) *">
            <Input type="number" value={budgetFrom} onChange={(e) => setBudgetFrom(e.target.value)} placeholder="5000" className={inputCls} />
          </Field>
          <Field label="Budget To (₹) *">
            <Input type="number" value={budgetTo} onChange={(e) => setBudgetTo(e.target.value)} placeholder="15000" className={inputCls} />
          </Field>
        </div>

        <Field label="Required Experience">
          <Input value={requiredExperience} onChange={(e) => setRequiredExperience(e.target.value)} placeholder="e.g. 3+ years wedding photography" className={inputCls} />
        </Field>

        <Field label="Requirements">
          <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="List any specific requirements..." rows={2} className={textareaCls} />
        </Field>

        <Field label="Application Deadline">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
        </Field>

        <label className="flex items-center gap-3 rounded-2xl bg-white p-4">
          <input type="checkbox" checked={travelRequired} onChange={(e) => setTravelRequired(e.target.checked)} className="h-5 w-5 accent-[#1a1a2e]" />
          <span className="text-sm text-[#131315]">Travel required</span>
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" disabled={loading} className="h-12 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white hover:bg-[#2a2a4e]">
          {loading ? "Posting..." : "Post Job"}
        </Button>
      </form>
    </div>
  );
}

const inputCls = "h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0";
const textareaCls = "w-full rounded-[14px] border-0 bg-white px-4 py-3 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus:outline-none";
const selectCls = "h-12 w-full rounded-[14px] border-0 bg-white px-4 text-[#131315] focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#131315]">{label}</label>
      {children}
    </div>
  );
}
