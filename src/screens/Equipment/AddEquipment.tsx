import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { Equipment } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Package, MapPin, IndianRupee, CheckCircle } from "lucide-react";

const CATEGORIES = [
  { value: "camera", label: "Camera" },
  { value: "lens", label: "Lens" },
  { value: "flash", label: "Flash" },
  { value: "lighting", label: "Lighting" },
  { value: "tripod", label: "Tripod" },
  { value: "gimbal", label: "Gimbal" },
  { value: "drone", label: "Drone" },
  { value: "audio", label: "Audio" },
  { value: "studio", label: "Studio Equipment" },
  { value: "background", label: "Background" },
  { value: "other", label: "Other" },
];

const CONDITIONS = ["new", "excellent", "good", "fair", "poor"];

interface AddEquipmentProps {
  onDone: () => void;
}

export function AddEquipment({ onDone }: AddEquipmentProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [serialPublic, setSerialPublic] = useState(false);
  const [category, setCategory] = useState("camera");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("good");
  const [conditionNotes, setConditionNotes] = useState("");
  const [hourlyPrice, setHourlyPrice] = useState("");
  const [dailyPrice, setDailyPrice] = useState("");
  const [weeklyPrice, setWeeklyPrice] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !dailyPrice) {
      setError("Name and daily price are required");
      return;
    }
    setLoading(true);
    const { error: insertError } = await supabase.from("equipment").insert({
      owner_id: profile!.id,
      name,
      brand: brand || null,
      model: model || null,
      serial_number: serialNumber || null,
      serial_number_public: serialPublic,
      category,
      description: description || null,
      condition_rating: condition,
      condition_notes: conditionNotes || null,
      hourly_price: hourlyPrice ? parseInt(hourlyPrice) : null,
      daily_price: parseInt(dailyPrice),
      weekly_price: weeklyPrice ? parseInt(weeklyPrice) : null,
      security_deposit: securityDeposit ? parseInt(securityDeposit) : null,
      pickup_available: pickupAvailable,
      delivery_available: deliveryAvailable,
      delivery_fee: deliveryFee ? parseInt(deliveryFee) : null,
      location: location || null,
      is_available: true,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      onDone();
    }
  };

  const inputCls = "h-12 rounded-[14px] border-0 bg-white px-4 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0";
  const textareaCls = "w-full rounded-[14px] border-0 bg-white px-4 py-3 text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus:outline-none";
  const selectCls = "h-12 w-full rounded-[14px] border-0 bg-white px-4 text-[#131315] focus:outline-none";

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#f8f6f2] px-5 pt-12 pb-3">
        <button onClick={onDone} className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <ArrowLeft size={18} className="text-[#131315]" />
        </button>
        <h1 className="text-lg font-bold text-[#131315]">Add Equipment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#131315]">Equipment Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Canon EOS R5" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#131315]">Brand</label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Canon" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#131315]">Model</label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="EOS R5" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#131315]">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#131315]">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the equipment..." rows={2} className={textareaCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#131315]">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className={selectCls}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#131315]">Serial Number</label>
            <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Optional" className={inputCls} />
          </div>
        </div>
        <label className="flex items-center gap-3 rounded-2xl bg-white p-4">
          <input type="checkbox" checked={serialPublic} onChange={(e) => setSerialPublic(e.target.checked)} className="h-5 w-5 accent-[#1a1a2e]" />
          <span className="text-sm text-[#131315]">Show serial number publicly</span>
        </label>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#131315]">Condition Notes</label>
          <textarea value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} placeholder="Any scratches, wear, etc." rows={2} className={textareaCls} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#131315]">Hourly (₹)</label>
            <Input type="number" value={hourlyPrice} onChange={(e) => setHourlyPrice(e.target.value)} placeholder="500" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#131315]">Daily (₹) *</label>
            <Input type="number" value={dailyPrice} onChange={(e) => setDailyPrice(e.target.value)} placeholder="2000" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#131315]">Weekly (₹)</label>
            <Input type="number" value={weeklyPrice} onChange={(e) => setWeeklyPrice(e.target.value)} placeholder="10000" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#131315]">Security Deposit (₹)</label>
            <Input type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} placeholder="5000" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#131315]">Delivery Fee (₹)</label>
            <Input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="200" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#131315]">Location</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai, Maharashtra" className={inputCls} />
        </div>
        <label className="flex items-center gap-3 rounded-2xl bg-white p-4">
          <input type="checkbox" checked={pickupAvailable} onChange={(e) => setPickupAvailable(e.target.checked)} className="h-5 w-5 accent-[#1a1a2e]" />
          <span className="text-sm text-[#131315]">Pickup available</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl bg-white p-4">
          <input type="checkbox" checked={deliveryAvailable} onChange={(e) => setDeliveryAvailable(e.target.checked)} className="h-5 w-5 accent-[#1a1a2e]" />
          <span className="text-sm text-[#131315]">Delivery available</span>
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-[14px] bg-[#1a1a2e] text-sm text-white hover:bg-[#2a2a4e]">
          {loading ? "Adding..." : "Add Equipment"}
        </Button>
      </form>
    </div>
  );
}
