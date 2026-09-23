import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { verifyOtp } from "../../lib/auth";
import { useAuth } from "../../context/AuthContext";

interface OtpScreenProps {
  phone: string;
  devCode?: string;
  onBack: () => void;
}

export function OtpScreen({ phone, devCode, onBack }: OtpScreenProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(30);
  const { signInWithTokens } = useAuth();

  useEffect(() => {
    if (devCode) setCode(devCode);
  }, [devCode]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    const result = await verifyOtp(phone, code);
    if (result.success && result.access_token && result.refresh_token) {
      await signInWithTokens(result.access_token, result.refresh_token);
    } else {
      setError(result.error || "Verification failed");
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#f8f6f2] px-7">
      <header className="mt-[54px]">
        <button onClick={onBack} className="text-sm text-[#63636b]">
          ← Back
        </button>
      </header>
      <section className="mt-[60px]">
        <h1 className="text-[32px] font-bold leading-[39px] text-[#131315]">Verify OTP</h1>
        <p className="mt-[9px] text-sm leading-[17px] text-[#63636b]">
          Enter the code sent to {phone}
        </p>
        {devCode && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Dev mode: your code is <span className="font-bold">{devCode}</span>
          </div>
        )}
        <form className="mt-[43px]" onSubmit={handleVerify}>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="h-[58px] rounded-[14px] border-0 bg-white px-[18px] text-center text-2xl font-bold tracking-[8px] text-[#131315] shadow-none placeholder:text-[#c0c0c0] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="mt-5 h-12 w-full rounded-[14px] bg-[#1a1a2e] p-0 text-sm text-white hover:bg-[#2a2a4e]"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </Button>
        </form>
        <div className="mt-5 text-center">
          {resendCountdown > 0 ? (
            <p className="text-sm text-[#63636b]">Resend in {resendCountdown}s</p>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-[#1a1a2e]"
            >
              Resend OTP
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
