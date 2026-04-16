import { useEffect, useState } from "react";
import { advisoriesApi, marineApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { languageToVoice, speak } from "../utils/voice.js";

export default function AdvisoryDashboard() {
  const { profile } = useAuth();
  const [marine, setMarine] = useState(null);
  const [advisory, setAdvisory] = useState(null);

  useEffect(() => {
    const load = async () => {
      const zoneId = profile?.primaryZoneId || "zone-palk-01";
      const [marineData, advisoryData] = await Promise.all([
        marineApi.overview(zoneId),
        advisoriesApi.current(zoneId, profile?.language || "en"),
      ]);
      setMarine(marineData.observation || marineData.conditions || marineData);
      setAdvisory(advisoryData);
    };
    load();
  }, [profile?.language, profile?.primaryZoneId]);

  const read = () => speak(advisory?.preferredMessage || advisory?.summary?.en || "", languageToVoice[profile?.language || "en"]);

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="rounded-[32px] bg-[linear-gradient(135deg,#f9a825,#ffddb5)] p-6 shadow-lg md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-on-surface/60">Proceed with caution</p>
        <h1 className="mt-2 text-4xl font-black uppercase text-on-surface">Advisory</h1>
        <p className="mt-3 max-w-2xl text-lg font-medium text-on-surface">
          {advisory?.preferredMessage || advisory?.summary?.en || "Moderate conditions expected."}
        </p>
        <button onClick={read} className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-primary">
          Read aloud
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          ["Wind", marine?.windSpeedKmph || marine?.windSpeed || 0, "km/h"],
          ["Wave", marine?.waveHeightM || marine?.waveHeight || 0, "m"],
          ["Visibility", marine?.visibilityKm || marine?.visibility || 0, "km"],
        ].map(([label, value, unit]) => (
          <div key={label} className="rounded-[28px] bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-outline">{label}</p>
            <p className="mt-3 text-4xl font-black text-on-surface">
              {value} <span className="text-lg text-outline">{unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
