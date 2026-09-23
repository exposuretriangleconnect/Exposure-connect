import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { sendOtp } from "../../lib/auth";

interface LoginScreenProps {
  onOtpSent: (phone: string, devCode?: string) => void;
}

export function LoginScreen({ onOtpSent }: LoginScreenProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\s/g, "")}`;
    if (!/^\+\d{10,15}$/.test(cleanPhone)) {
      setError("Enter a valid mobile number");
      return;
    }

    setLoading(true);
    const result = await sendOtp(cleanPhone);
    setLoading(false);

    if (result.success) {
      onOtpSent(cleanPhone, result.dev_code);
    } else {
      setError(result.error || "Failed to send OTP");
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#f8f6f2] px-7">
      <header className="mt-[54px]">
        <p className="text-base font-bold tracking-0 text-[#1a1a2e]">LENSWORK</p>
      </header>
      <section className="mt-[77px]">
        <h1 className="text-[32px] font-bold leading-[39px] text-[#131315]">Welcome</h1>
        <p className="mt-[9px] text-sm leading-[17px] text-[#63636b]">
          Enter your mobile number to continue
        </p>
        <form className="mt-[43px]" onSubmit={handleSubmit}>
          <label htmlFor="mobile-number" className="sr-only">
            Mobile number
          </label>
          <div className="flex h-[58px] w-full items-center rounded-[14px] bg-white px-[18px]">
            <span className="shrink-0 text-[15px] text-[#63636b]">+91</span>
            <Input
              id="mobile-number"
              type="tel"
              inputMode="tel"
              placeholder="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-auto min-h-0 border-0 bg-transparent px-3 py-0 text-[15px] leading-[18px] text-[#131315] shadow-none placeholder:text-[#63636b] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="mt-5 h-12 w-full rounded-[14px] bg-[#1a1a2e] p-0 text-sm text-white hover:bg-[#2a2a4e] focus-visible:ring-[#1a1a2e]"
          >
            {loading ? "Sending..." : "Continue"}
          </Button>
        </form>
        <p className="mt-[22px] text-[11px] leading-[13px] text-[#63636b]">
          By continuing, you agree to Terms &amp; Privacy.
        </p>
      </section>
    </main>
  );
}
