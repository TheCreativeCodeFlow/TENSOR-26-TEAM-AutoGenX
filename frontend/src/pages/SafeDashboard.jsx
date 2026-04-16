import { useEffect, useMemo, useState } from "react";
import { advisoriesApi, marineApi, zonesApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import EmergencyButton from "../components/EmergencyButton.jsx";
import VoiceReadoutButton from "../components/VoiceReadoutButton.jsx";

export default function SafeDashboard() {
  const { profile, refreshProfile, user } = useAuth();
  const [zone, setZone] = useState(null);
  const [marine, setMarine] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeZoneId = profile?.primaryZoneId || "zone-palk-01";

  useEffect(() => {
    const load = async () => {
      try {
        const [zoneList, marineData, advisoryData] = await Promise.all([
          zonesApi.getAll(),
          marineApi.overview(activeZoneId),
          advisoriesApi.current(activeZoneId, profile?.language || "en"),
        ]);
        setZones(Array.isArray(zoneList) ? zoneList : zoneList.zones || []);
        setZone(marineData.zone || marineData);
        setMarine(marineData.observation || marineData.conditions || marineData);
        setAdvisory(advisoryData);
      } catch (_error) {
        setZones([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeZoneId, profile?.language]);

  const currentLanguageLabel = useMemo(() => {
    const current = {
      en: "English",
      ta: "Tamil",
      ml: "Malayalam",
      te: "Telugu",
      or: "Odia",
    };
    return current[profile?.language || "en"] || "English";
  }, [profile?.language]);

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const riskLevel = advisory?.level || "SAFE";
  const riskTone = riskLevel === "SAFE" ? "text-primary" : riskLevel === "ADVISORY" ? "text-secondary" : "text-tertiary";

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#00450d,#1b5e20_45%,#7c000a_140%)] p-6 text-white shadow-[0_25px_80px_rgba(0,69,13,0.3)] md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-white/65">Today in {zone?.name || "your zone"}</p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
            {advisory?.recommendation || "GO"}
          </h2>
          <p className="mt-4 max-w-2xl text-base font-medium text-white/90 md:text-lg">
            {advisory?.preferredMessage || advisory?.summary?.en || "Sea conditions are stable."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <VoiceReadoutButton
              text={advisory?.preferredMessage || advisory?.summary?.en || "Safety update unavailable."}
              language={profile?.language || "en"}
              className="!m-0 !bg-white !text-primary"
            />
            <EmergencyButton compact />
          </div>
        </section>

        <section className="grid gap-4">
          <div className="fade-in rounded-[28px] bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">Risk score</p>
            <div className={`mt-2 text-5xl font-black ${riskTone}`}>{advisory?.riskScore ?? 0}</div>
            <p className="mt-2 text-sm font-bold text-on-surface-variant">Language: {currentLanguageLabel}</p>
          </div>

          <div className="fade-in-delay rounded-[28px] bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">Safe return window</p>
            <p className="mt-2 text-2xl font-black text-primary">
              {advisory?.safeReturnWindowEstimate?.available ? advisory.safeReturnWindowEstimate.startAt : advisory?.safeReturnWindow || "Not available"}
            </p>
            <p className="mt-2 text-sm font-medium text-on-surface-variant">
              {advisory?.safeReturnWindowEstimate?.note || "Based on synthetic coastal forecast thresholds."}
            </p>
          </div>
        </section>
      </div>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          ["Wind speed", marine?.windSpeedKmph || marine?.windSpeed || 0, "km/h", "air"],
          ["Wave height", marine?.waveHeightM || marine?.waveHeight || 0, "m", "waves"],
          ["Visibility", marine?.visibilityKm || marine?.visibility || 0, "km", "visibility"],
        ].map(([title, value, unit, icon]) => (
          <div key={title} className="slide-up rounded-[28px] bg-white p-5 shadow-lg transition duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-outline">{title}</p>
              <span className="material-symbols-outlined text-primary">{icon}</span>
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-black text-on-surface">{value}</span>
              <span className="pb-1 text-lg font-bold text-outline">{unit}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] bg-white p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-outline">Coastal map</p>
              <h3 className="text-2xl font-black text-on-surface">Active risk overlay</h3>
            </div>
            <button
              type="button"
              onClick={() => refreshProfile()}
              className="rounded-full bg-surface-container-highest px-4 py-2 text-sm font-black transition hover:-translate-y-0.5"
            >
              Refresh profile
            </button>
          </div>
          <div className="relative overflow-hidden rounded-[28px] border border-surface-container-highest bg-[linear-gradient(180deg,#dff0ff,#f4f9ef)] p-4">
            <svg viewBox="0 0 1000 560" className="h-[320px] w-full">
              <defs>
                <linearGradient id="sea" x1="0" x2="1">
                  <stop offset="0%" stopColor="#d0f0ff" />
                  <stop offset="100%" stopColor="#dff2df" />
                </linearGradient>
              </defs>
              <rect width="1000" height="560" rx="32" fill="url(#sea)" />
              {zones.map((item, index) => {
                const paths = item.polygon?.map(([lat, lng]) => `${(lng % 1) * 760 + 120},${(lat % 1) * 360 + 80}`).join(" ");
                return (
                  <g key={item.id}>
                    <polygon points={paths} fill={index === 0 ? "rgba(124,0,10,0.35)" : index === 1 ? "rgba(131,84,0,0.25)" : "rgba(0,69,13,0.2)"} stroke="rgba(0,0,0,0.15)" />
                    <text x="120" y={60 + index * 28} className="fill-on-surface text-[18px] font-black">
                      {item.name}
                    </text>
                  </g>
                );
              })}
              <circle cx="500" cy="260" r="14" fill="#00450d">
                <animate attributeName="r" values="14;18;14" dur="2.2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-outline">Live advisory</p>
          <div className="mt-3 rounded-[28px] bg-surface-container-low p-5">
            <p className="text-sm font-black uppercase text-primary">{riskLevel}</p>
            <p className="mt-3 text-base font-medium text-on-surface-variant">
              {advisory?.summary?.[profile?.language || "en"] || advisory?.summary?.en || "No live advisory available."}
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <p className="text-xs font-black uppercase text-outline">Current zone</p>
              <p className="mt-1 font-bold">{zone?.name || "Palk Strait"}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <p className="text-xs font-black uppercase text-outline">Safe phone</p>
              <p className="mt-1 font-bold">{profile?.phone || profile?.safetyPhone || user?.phone || "-"}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <p className="text-xs font-black uppercase text-outline">Location</p>
              <p className="mt-1 font-bold">{profile?.locationLabel || "Detect location in onboarding"}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
