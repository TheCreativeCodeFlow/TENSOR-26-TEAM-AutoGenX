import { useEffect, useState } from "react";
import { advisoriesApi, zonesApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import CoastalMap from "../components/CoastalMap.jsx";
import VoiceReadoutButton from "../components/VoiceReadoutButton.jsx";

export default function MapRiskZones() {
  const { profile } = useAuth();
  const [zones, setZones] = useState([]);
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const zoneData = await zonesApi.getAll();
        const list = Array.isArray(zoneData) ? zoneData : zoneData.zones || [];
        setZones(list);
        const currentZone = profile?.primaryZoneId || list[0]?.id || "zone-palk-01";
        setAdvisory(await advisoriesApi.current(currentZone, profile?.language || "en"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.language, profile?.primaryZoneId]);

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="slide-up overflow-hidden rounded-[32px] bg-white p-4 shadow-lg md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">Map</p>
              <h2 className="text-3xl font-black text-on-surface">Danger zone overlay</h2>
            </div>
            <span className="rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
              {advisory?.level || "SAFE"}
            </span>
          </div>

          <CoastalMap
            lat={Number(profile?.latitude) || 9.62}
            lng={Number(profile?.longitude) || 79.31}
            zoom={9}
            title="Live coastal location map"
          />

          <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#dff0ff,#f4f9ef)]">
            <svg viewBox="0 0 1200 700" className="h-[520px] w-full">
              <rect width="1200" height="700" fill="#dff4ef" />
              {zones.map((zone, index) => {
                const fill = index === 0 ? "rgba(124,0,10,0.35)" : index === 1 ? "rgba(131,84,0,0.25)" : "rgba(0,69,13,0.2)";
                const points = zone.polygon?.map(([lat, lng]) => `${(lng - 78) * 180},${700 - (lat - 8) * 140}`).join(" ");
                return <polygon key={zone.id} points={points} fill={fill} stroke="rgba(0,0,0,0.2)" strokeWidth="3" />;
              })}
              <circle cx="560" cy="360" r="18" fill="#00450d">
                <animate attributeName="r" values="18;24;18" dur="2.1s" repeatCount="indefinite" />
              </circle>
              <text x="40" y="60" fill="#1a1c1c" fontSize="28" fontWeight="900">
                {profile?.locationLabel || "Location pending"}
              </text>
            </svg>
          </div>
        </section>

        <section className="fade-in space-y-4">
          <div className="rounded-[28px] bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">Legend</p>
            <div className="mt-4 space-y-3">
              {zones.map((zone, index) => (
                <div key={zone.id} className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: index === 0 ? "#7c000a" : index === 1 ? "#835400" : "#00450d" }} />
                  <span className="font-bold text-on-surface">{zone.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">Risk summary</p>
            <p className="mt-3 text-2xl font-black text-on-surface">{advisory?.recommendation || "GO"}</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {advisory?.preferredMessage || advisory?.summary?.en || "No active advisory."}
            </p>
            <VoiceReadoutButton
              className="mt-4"
              language={profile?.language || "en"}
              text={advisory?.preferredMessage || advisory?.summary?.en || "No active advisory."}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
