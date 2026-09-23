import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { Equipment, RentalRequest } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Package, MapPin, IndianRupee, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface EquipmentDetailsProps {
  equipmentId: string;
  onBack: () => void;
}

export function EquipmentDetails({ equipmentId, onBack }: EquipmentDetailsProps) {
  const { profile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRental, setShowRental] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Rental form
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentalType, setRentalType] = useState("daily");
  const [pickupMethod, setPickupMethod] = useState("pickup");
  const [notes, setNotes] = useState("");
  const [existingRequest, setExistingRequest] = useState<RentalRequest | null>(null);

  useEffect(() => {
    loadEquipment();
  }, [equipmentId]);

  const loadEquipment = async () => {
    setLoading(true);
    const { data: eq } = await supabase
      .from("equipment")
      .select("*")
      .eq("id", equipmentId)
      .maybeSingle();
    if (eq) {
      setEquipment(eq as Equipment);
      const { data: ownerData } = await supabase
        .from("profiles")
        .select("id, name, profile_photo, city, verification_status")
        .eq("id", eq.owner_id)
        .maybeSingle();
      if (ownerData) setOwner(ownerData);
    }
    if (profile) {
      const { data: existing } = await supabase
        .from("rental_requests")
        .select("*")
        .eq("equipment_id", equipmentId)
        .eq("renter_id", profile.id)
        .in("status", ["pending", "accepted"])
        .maybeSingle();
      if (existing) setExistingRequest(existing as RentalRequest);
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    if (!equipment || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    let price = 0;
    if (rentalType === "hourly" && equipment.hourly_price) price = equipment.hourly_price * days * 8;
    else if (rentalType === "daily" && equipment.daily_price) price = equipment.daily_price * days;
    else if (rentalType === "weekly" && equipment.weekly_price) price = equipment.weekly_price * Math.ceil(days / 7);
    return price;
  };

  const handleRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !equipment) return;
    setSubmitting(true);
    const { error } = await supabase.from("rental_requests").insert({
      equipment_id: equipmentId,
      renter_id: profile.id,
      owner_id: equipment.owner_id,
      start_date: startDate,
      end_date: endDate,
      rental_type: rentalType,
      total_price: calculateTotal(),
      security_deposit: equipment.security_deposit,
      pickup_method: pickupMethod,
      notes: notes || null,
      status: "pending",
    });
    setSubmitting(false);
    if (!error) {
      setShowRental(false);
      loadEquipment();
    }
  };

  if (loading) return <div className="pt-20 text-center text-sm text-[#63636b]">Loading...</div>;
  if (!equipment) return <div className="pt-20 text-center text-sm text-[#63636b]">Equipment not found</div>;

  const isOwner = profile?.id === equipment.owner_id;

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#f8f6f2] px-5 pt-12 pb-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <ArrowLeft size={18} className="text-[#131315]" />
        </button>
        <h1 className="text-lg font-bold text-[#131315]">Equipment Details</h1>
      </div>

      <div className="px-5 pb-8">
        {/* Image */}
        {equipment.images && equipment.images.length > 0 ? (
          <div className="h-48 w-full overflow-hidden rounded-2xl">
            <img src={equipment.images[0]} alt={equipment.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-white">
            <Package size={48} className="text-[#9ca3af]" />
          </div>
        )}

        {/* Details */}
        <div className="mt-4 rounded-2xl bg-white p-5">
          <h2 className="text-lg font-bold text-[#131315]">{equipment.name}</h2>
          {equipment.brand && <p className="mt-1 text-sm text-[#63636b]">{equipment.brand} {equipment.model}</p>}
          {equipment.description && <p className="mt-2 text-sm text-[#63636b]">{equipment.description}</p>}

          <div className="mt-4 space-y-2">
            {equipment.location && (
              <div className="flex items-center gap-2 text-sm text-[#63636b]">
                <MapPin size={14} /> {equipment.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-[#63636b]">
              <Package size={14} /> <span className="capitalize">{equipment.category}</span> • <span className="capitalize">{equipment.condition_rating}</span>
            </div>
            {equipment.condition_notes && (
              <p className="text-sm text-[#63636b]">{equipment.condition_notes}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {equipment.hourly_price && (
              <div className="rounded-xl bg-[#f8f6f2] p-3 text-center">
                <p className="text-xs text-[#63636b]">Hourly</p>
                <p className="mt-1 text-sm font-bold text-[#1a1a2e]">₹{equipment.hourly_price}</p>
              </div>
            )}
            {equipment.daily_price && (
              <div className="rounded-xl bg-[#f8f6f2] p-3 text-center">
                <p className="text-xs text-[#63636b]">Daily</p>
                <p className="mt-1 text-sm font-bold text-[#1a1a2e]">₹{equipment.daily_price}</p>
              </div>
            )}
            {equipment.weekly_price && (
              <div className="rounded-xl bg-[#f8f6f2] p-3 text-center">
                <p className="text-xs text-[#63636b]">Weekly</p>
                <p className="mt-1 text-sm font-bold text-[#1a1a2e]">₹{equipment.weekly_price}</p>
              </div>
            )}
          </div>
          {equipment.security_deposit && (
            <p className="mt-2 text-xs text-[#63636b]">Security deposit: ₹{equipment.security_deposit}</p>
          )}
        </div>

        {/* Owner info */}
        {owner && (
          <div className="mt-4 rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase text-[#9ca3af]">Owner</p>
            <div className="mt-2 flex items-center gap-3">
              {owner.profile_photo ? (
                <img src={owner.profile_photo} alt={owner.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f6f2]">
                  <Package size={18} className="text-[#9ca3af]" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-[#131315]">{owner.name || "Unnamed"}</p>
                {owner.city && <p className="text-xs text-[#63636b]">{owner.city}</p>}
              </div>
            </div>
          </div>
        )}

        {/* P2P Payment disclaimer */}
        <div className="mt-4 rounded-2xl bg-amber-50 p-4">
          <p className="text-xs leading-relaxed text-amber-700">
            Payments between users are external transactions and are not processed, held, settled, or guaranteed by the platform.
          </p>
        </div>

        {/* Actions */}
        {!isOwner && (
          <div className="mt-4">
            {existingRequest ? (
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-medium text-[#131315]">Rental Request Status</p>
                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  existingRequest.status === "pending" ? "bg-amber-100 text-amber-700" :
                  existingRequest.status === "accepted" ? "bg-green-100 text-green-700" :
                  "bg-red-100 text-red-700"
                }`}>{existingRequest.status}</span>
              </div>
            ) : showRental ? (
              <form onSubmit={handleRental} className="space-y-3 rounded-2xl bg-white p-4">
                <h3 className="text-sm font-bold text-[#131315]">Request Rental</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#63636b]">Start Date</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="h-12 rounded-[14px] border-0 bg-[#f8f6f2] px-4 text-[#131315] focus-visible:ring-0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#63636b]">End Date</label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="h-12 rounded-[14px] border-0 bg-[#f8f6f2] px-4 text-[#131315] focus-visible:ring-0" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#63636b]">Rental Type</label>
                  <select value={rentalType} onChange={(e) => setRentalType(e.target.value)} className="h-12 w-full rounded-[14px] border-0 bg-[#f8f6f2] px-4 text-[#131315] focus:outline-none">
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#63636b]">Pickup Method</label>
                  <select value={pickupMethod} onChange={(e) => setPickupMethod(e.target.value)} className="h-12 w-full rounded-[14px] border-0 bg-[#f8f6f2] px-4 text-[#131315] focus:outline-none">
                    <option value="pickup">Pickup</option>
                    {equipment.delivery_available && <option value="delivery">Delivery</option>}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#63636b]">Notes</label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requests..." className="h-12 rounded-[14px] border-0 bg-[#f8f6f2] px-4 text-[#131315] focus-visible:ring-0" />
                </div>
                {startDate && endDate && (
                  <div className="rounded-xl bg-[#f8f6f2] p-3 text-center">
                    <p className="text-xs text-[#63636b]">Estimated Total</p>
                    <p className="text-lg font-bold text-[#1a1a2e]">₹{calculateTotal()}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowRental(false)} className="flex-1 rounded-[14px] bg-gray-100 py-3 text-sm text-[#63636b]">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 rounded-[14px] bg-[#1a1a2e] py-3 text-sm text-white">
                    {submitting ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </form>
            ) : equipment.is_available ? (
              <Button onClick={() => setShowRental(true)} className="h-12 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white hover:bg-[#2a2a4e]">
                Request Rental
              </Button>
            ) : (
              <p className="rounded-2xl bg-white p-4 text-center text-sm text-[#63636b]">Currently unavailable</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
