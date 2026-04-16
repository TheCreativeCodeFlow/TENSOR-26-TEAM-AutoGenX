import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const DEFAULT_PHONE = "+919876543210";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, hasProfile, loading } = useAuth();
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated && hasProfile) navigate("/", { replace: true });
    if (isAuthenticated && !hasProfile) navigate("/onboarding", { replace: true });
  }, [hasProfile, isAuthenticated, loading, navigate]);

  const sanitizePhone = (value) => value.replace(/[^+\d]/g, "");

  const requestOtp = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const cleanPhone = sanitizePhone(phone);
      const { error: authError } = await authApi.signInWithOtp(cleanPhone);
      if (authError) throw authError;
      setStep("otp");
      setNotice("OTP sent through Supabase Auth. If you are in local demo mode, use the test code from the Supabase dashboard or your dev SMS provider.");
    } catch (err) {
      setError(err.message || "Failed to request OTP");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const cleanPhone = sanitizePhone(phone);
      const { error: authError } = await authApi.verifyOtp(cleanPhone, otp);
      if (authError) throw authError;
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setBusy(false);
    }
  };

  const startGoogleOAuth = async () => {
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await authApi.signInWithGoogle();
      if (authError) throw authError;
    } catch (err) {
      setError(err.message || "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(27,94,32,0.2),_transparent_40%),linear-gradient(180deg,#f8fbf7_0%,#eef7ef_55%,#f8f2ea_100%)]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(135deg,rgba(0,69,13,0.95),rgba(123,0,10,0.88))] opacity-90" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[32px] border border-white/60 bg-white/85 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.12)] backdrop-blur-xl md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-white">
              <span className="material-symbols-outlined text-[18px]">phishing</span>
              Fisherfolk Sea Safety
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-black uppercase leading-none tracking-tight text-on-surface md:text-6xl">
              Weather, SOS, and boat safety in one flow.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium text-on-surface-variant md:text-lg">
              Sign in with Supabase OTP, then finish your coastal profile so the backend can calculate the safest fishing advice for your zone and language.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Phone OTP", "Free Supabase auth"],
                ["Voice Readout", "Speak alerts aloud"],
                ["SOS 1554", "One-tap coast guard"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-3xl bg-surface-container-lowest p-4 shadow-sm transition duration-300 hover:-translate-y-1">
                  <p className="text-sm font-black uppercase text-primary">{title}</p>
                  <p className="mt-2 text-sm font-medium text-on-surface-variant">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.14)] backdrop-blur-xl md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">Sign in</p>
                <h2 className="mt-2 text-2xl font-black text-on-surface">Start with your phone</h2>
              </div>
              <button
                type="button"
                onClick={startGoogleOAuth}
                disabled={busy}
                className="rounded-full bg-surface-container-highest px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                Google OAuth
              </button>
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl border border-tertiary/20 bg-tertiary/10 px-4 py-3 text-sm font-bold text-tertiary">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
                {notice}
              </div>
            ) : null}

            <form onSubmit={step === "phone" ? requestOtp : verifyOtp} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Phone number</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
              </label>

              {step === "otp" ? (
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">OTP</span>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.35em] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    maxLength={6}
                    required
                  />
                </label>
              ) : null}

              <button
                type="submit"
                disabled={busy || (step === "otp" && otp.length !== 6)}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-black uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(0,69,13,0.25)] transition duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                <span className="material-symbols-outlined transition group-hover:translate-x-1">
                  {step === "phone" ? "send" : "verified_user"}
                </span>
                {busy ? "Working..." : step === "phone" ? "Send OTP" : "Verify and continue"}
              </button>
            </form>

            {step === "otp" ? (
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setNotice("");
                }}
                className="mt-4 w-full rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-black text-outline transition hover:bg-surface-container-highest"
              >
                Change phone number
              </button>
            ) : null}

            <div className="mt-8 rounded-[28px] bg-gradient-to-br from-[#00450d] to-[#7c000a] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Emergency</p>
              <p className="mt-2 text-3xl font-black">1554</p>
              <p className="mt-2 text-sm text-white/85">Tap SOS from the dashboard for an immediate coast guard call and alert.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
