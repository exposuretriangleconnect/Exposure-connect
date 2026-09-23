import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { JobPost, JobApplication, Category } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowLeft, MapPin, IndianRupee, Calendar, Clock, Users, Star, CheckCircle, XCircle, Award } from "lucide-react";

interface JobDetailsProps {
  jobId: string;
  onBack: () => void;
}

export function JobDetails({ jobId, onBack }: JobDetailsProps) {
  const { profile, capabilities } = useAuth();
  const [job, setJob] = useState<JobPost | null>(null);
  const [applications, setApplications] = useState<(JobApplication & { profiles: any[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);

  // Apply form
  const [proposal, setProposal] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<JobApplication | null>(null);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    setLoading(true);
    const { data: jobData } = await supabase
      .from("job_posts")
      .select("*, categories(name)")
      .eq("id", jobId)
      .maybeSingle();
    if (jobData) setJob(jobData as JobPost);

    // Check if already applied
    if (profile) {
      const { data: existing } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId)
        .eq("photographer_id", profile.id)
        .maybeSingle();
      if (existing) setExistingApplication(existing as JobApplication);
    }

    // Load applications if user is the job owner
    if (jobData && profile && jobData.client_id === profile.id) {
      const { data: apps } = await supabase
        .from("job_applications")
        .select("*, profiles!job_applications_photographer_id_fkey(id, name, profile_photo, city, verification_status, photographer_profiles(experience_years, rating, completed_jobs))")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (apps) setApplications(apps as any);
    }

    setLoading(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    const { error } = await supabase.from("job_applications").insert({
      job_id: jobId,
      photographer_id: profile.id,
      proposal: proposal || null,
      proposed_price: proposedPrice ? parseInt(proposedPrice) : null,
      availability_note: availabilityNote || null,
      message: message || null,
      status: "pending",
    });
    setSubmitting(false);
    if (!error) {
      setShowApply(false);
      loadJob();
    }
  };

  const handleApplicantAction = async (appId: string, status: string) => {
    await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", appId);
    loadJob();
  };

  if (loading) return <div className="pt-20 text-center text-sm text-[#63636b]">Loading...</div>;
  if (!job) return <div className="pt-20 text-center text-sm text-[#63636b]">Job not found</div>;

  const isOwner = profile?.id === job.client_id;
  const canApply = capabilities.includes("find_jobs") && !existingApplication && job.status === "open";

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#f8f6f2] px-5 pt-12 pb-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <ArrowLeft size={18} className="text-[#131315]" />
        </button>
        <h1 className="text-lg font-bold text-[#131315]">Job Details</h1>
      </div>

      <div className="px-5 pb-8">
        {/* Job card */}
        <div className="rounded-2xl bg-white p-5">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-bold text-[#131315]">{job.title}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              job.status === "open" ? "bg-green-100 text-green-700" :
              job.status === "booked" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-600"
            }`}>{job.status}</span>
          </div>
          {job.description && <p className="mt-2 text-sm text-[#63636b]">{job.description}</p>}

          <div className="mt-4 space-y-2">
            {job.location && (
              <div className="flex items-center gap-2 text-sm text-[#63636b]">
                <MapPin size={14} /> {job.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-[#63636b]">
              <Calendar size={14} /> {new Date(job.job_date).toLocaleDateString()}
            </div>
            {job.start_time && (
              <div className="flex items-center gap-2 text-sm text-[#63636b]">
                <Clock size={14} /> {job.start_time}{job.end_time ? ` - ${job.end_time}` : ""}
              </div>
            )}
            {job.budget_from && job.budget_to && (
              <div className="flex items-center gap-2 text-sm font-medium text-[#1a1a2e]">
                <IndianRupee size={14} /> {job.budget_from} - {job.budget_to}
              </div>
            )}
          </div>
        </div>

        {/* Owner: show applicants */}
        {isOwner && (
          <div className="mt-4">
            <button
              onClick={() => setShowApplicants(!showApplicants)}
              className="flex w-full items-center justify-between rounded-2xl bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <Users size={20} className="text-[#63636b]" />
                <span className="text-sm font-medium text-[#131315]">Applicants ({applications.length})</span>
              </div>
            </button>
            {showApplicants && (
              <div className="mt-2 space-y-3">
                {applications.length === 0 && (
                  <p className="rounded-2xl bg-white p-4 text-center text-sm text-[#63636b]">No applications yet</p>
                )}
                {applications.map((app) => {
                  const p = app.profiles?.[0] || app.profiles;
                  const photoProfile = p?.photographer_profiles?.[0] || p?.photographer_profiles;
                  return (
                    <div key={app.id} className="rounded-2xl bg-white p-4">
                      <div className="flex items-center gap-3">
                        {p?.profile_photo ? (
                          <img src={p.profile_photo} alt={p.name} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f6f2]">
                            <Users size={20} className="text-[#9ca3af]" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#131315]">{p?.name || "Unnamed"}</p>
                          {photoProfile && (
                            <p className="text-xs text-[#63636b]">
                              {photoProfile.experience_years || 0} yrs exp
                              {photoProfile.rating > 0 && ` • ★ ${photoProfile.rating}`}
                            </p>
                          )}
                        </div>
                        {app.status !== "pending" && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            app.status === "accepted" ? "bg-green-100 text-green-700" :
                            app.status === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>{app.status}</span>
                        )}
                      </div>
                      {app.proposal && <p className="mt-2 text-sm text-[#63636b]">{app.proposal}</p>}
                      {app.proposed_price && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-[#63636b]">Proposed:</span>
                          <span className="text-sm font-medium text-[#1a1a2e]">₹{app.proposed_price}</span>
                          {job.budget_from && job.budget_to && (
                            <span className="text-xs text-[#63636b]">
                              (Budget: ₹{job.budget_from} - ₹{job.budget_to})
                            </span>
                          )}
                        </div>
                      )}
                      {app.status === "pending" && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleApplicantAction(app.id, "shortlisted")}
                            className="flex-1 rounded-lg bg-amber-50 py-2 text-xs font-medium text-amber-700"
                          >Shortlist</button>
                          <button
                            onClick={() => handleApplicantAction(app.id, "rejected")}
                            className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-medium text-red-600"
                          >Reject</button>
                          <button
                            onClick={() => handleApplicantAction(app.id, "accepted")}
                            className="flex-1 rounded-lg bg-green-50 py-2 text-xs font-medium text-green-700"
                          >Accept</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Photographer: apply or view application status */}
        {!isOwner && (
          <div className="mt-4">
            {existingApplication ? (
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-medium text-[#131315]">Application Status</p>
                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  existingApplication.status === "pending" ? "bg-amber-100 text-amber-700" :
                  existingApplication.status === "shortlisted" ? "bg-blue-100 text-blue-700" :
                  existingApplication.status === "accepted" ? "bg-green-100 text-green-700" :
                  "bg-red-100 text-red-700"
                }`}>{existingApplication.status}</span>
                {existingApplication.proposed_price && (
                  <p className="mt-2 text-sm text-[#63636b]">Your proposal: ₹{existingApplication.proposed_price}</p>
                )}
              </div>
            ) : canApply ? (
              showApply ? (
                <form onSubmit={handleApply} className="space-y-3 rounded-2xl bg-white p-4">
                  <h3 className="text-sm font-bold text-[#131315]">Apply for this Job</h3>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#63636b]">Proposal</label>
                    <textarea value={proposal} onChange={(e) => setProposal(e.target.value)} placeholder="Describe why you're a good fit..." rows={3} className="w-full rounded-[14px] bg-[#f8f6f2] px-4 py-3 text-sm text-[#131315] focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#63636b]">Your Price (₹)</label>
                    <Input type="number" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} placeholder="Propose your price" className="h-12 rounded-[14px] border-0 bg-[#f8f6f2] px-4 text-[#131315] focus-visible:ring-0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#63636b]">Availability Note</label>
                    <Input value={availabilityNote} onChange={(e) => setAvailabilityNote(e.target.value)} placeholder="e.g. Available on the requested date" className="h-12 rounded-[14px] border-0 bg-[#f8f6f2] px-4 text-[#131315] focus-visible:ring-0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#63636b]">Message (optional)</label>
                    <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Any additional message" className="h-12 rounded-[14px] border-0 bg-[#f8f6f2] px-4 text-[#131315] focus-visible:ring-0" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowApply(false)} className="flex-1 rounded-[14px] bg-gray-100 py-3 text-sm text-[#63636b]">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 rounded-[14px] bg-[#1a1a2e] py-3 text-sm text-white">
                      {submitting ? "Applying..." : "Submit Application"}
                    </button>
                  </div>
                </form>
              ) : (
                <Button onClick={() => setShowApply(true)} className="h-12 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white hover:bg-[#2a2a4e]">
                  Apply for this Job
                </Button>
              )
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
