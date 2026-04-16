import { useEffect, useState } from "react";
import { advisoriesApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import EmergencyButton from "../components/EmergencyButton.jsx";

export default function CycloneDashboard() {
  const { profile } = useAuth();
  const [advisory, setAdvisory] = useState(null);

  useEffect(() => {
    const load = async () => {
      const zoneId = profile?.primaryZoneId || "zone-odisha-01";
      setAdvisory(await advisoriesApi.current(zoneId, profile?.language || "en"));
    };
    load();
  }, [profile?.language, profile?.primaryZoneId]);

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="rounded-[32px] bg-[linear-gradient(135deg,#330000,#7c000a)] p-6 text-white shadow-lg md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-white/70">Cyclone warning</p>
        <h1 className="mt-2 text-4xl font-black uppercase">Stay in port</h1>
        <p className="mt-3 max-w-2xl text-lg font-medium text-white/90">
          {advisory?.preferredMessage || advisory?.summary?.en || "Cyclone-linked conditions are dangerous."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <EmergencyButton compact />
          <a href="tel:1554" className="rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-tertiary">
            Call 1554
          </a>
        </div>
      </div>
    </div>
  );
}
