import { Link } from "react-router-dom";

const getBackendOrigin = () => {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1").replace(/\/$/, "");
  return apiBase.replace(/\/api\/v\d+$/, "");
};

export default function Home() {
  const apkUrl = `${getBackendOrigin()}/download/apk`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_16%_4%,#d8f1ff_0%,#e9f7f3_36%,#f6f7f9_100%)] px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute -left-20 top-4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-32 h-72 w-72 rounded-full bg-tertiary/10 blur-3xl" />

      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur-xl md:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-outline">Fisherfolk Safety Network</p>
            <p className="text-sm font-black text-primary">Indian Coastal Safety Platform</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg transition hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Login
            </Link>
            <a
              href={apkUrl}
              className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-on-surface transition hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              APK
            </a>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[34px] border border-white/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(3,44,65,0.12)] backdrop-blur-xl md:p-12">
            <h1 className="text-4xl font-black leading-tight text-on-surface md:text-6xl">Stay Safe At Sea</h1>
            <p className="mt-4 max-w-2xl text-base font-medium text-on-surface-variant md:text-lg">
              Offline boundary alerts, local-language voice guidance, real-time marine advisories, and one-tap SOS designed for Indian fishermen.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg transition hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Login
              </Link>
              <a
                href={apkUrl}
                className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-on-surface transition hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download APK
              </a>
            </div>
          </article>

          <aside className="rounded-[34px] border border-white/70 bg-white/85 p-6 shadow-[0_30px_90px_rgba(3,44,65,0.12)] backdrop-blur-xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">Emergency</p>
            <p className="mt-2 text-5xl font-black text-tertiary">1554</p>
            <p className="mt-2 text-sm font-medium text-on-surface-variant">Coast Guard emergency helpline integrated in SOS flow.</p>

            <div className="mt-6 grid gap-3">
              {[
                ["Offline Boundary Guard", "GPS alert even without internet"],
                ["Trip Safety Window", "Automatic stale forecast escalation"],
                ["Voice Alerts", "English, Tamil, Malayalam, Telugu, Odia"],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-sm font-black text-on-surface">{title}</p>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">{text}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Login or Install App", "Use OTP login on web or install APK for mobile-first flow."],
            ["2", "Set Fisher Profile", "Choose coastal zone, language, and safety phone once."],
            ["3", "Sail With Safety Guard", "Live advisories + boundary alerts + SOS if danger occurs."],
          ].map(([step, title, text]) => (
            <article key={step} className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur-xl">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{step}</div>
              <h3 className="mt-3 text-xl font-black text-on-surface">{title}</h3>
              <p className="mt-2 text-sm font-medium text-on-surface-variant">{text}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
