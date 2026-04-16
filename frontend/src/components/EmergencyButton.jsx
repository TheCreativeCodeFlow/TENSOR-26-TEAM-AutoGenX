import { useMemo, useState } from "react";
import { emergencyApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext";

export default function EmergencyButton({ compact = false, className = "" }) {
  const { profile, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const label = useMemo(() => (compact ? "SOS" : "1554 SOS"), [compact]);

  const getLiveLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 6000 },
      );
    });

  const trigger = async () => {
    setBusy(true);
    setMessage("");
    try {
      const liveLocation = await getLiveLocation();
      const payload = {
        zoneId: profile?.primaryZoneId || profile?.coastalAreaId || "zone-palk-01",
        location:
          liveLocation || {
            lat: Number(profile?.latitude) || 9.62,
            lng: Number(profile?.longitude) || 79.31,
          },
        distressType: "COASTAL_EMERGENCY",
        message: `Emergency SOS from ${profile?.fullName || user?.phone || "fisherfolk user"} near ${profile?.locationLabel || "coastline"}`,
        coastGuardNumber: "1554",
        safetyPhone: profile?.phone || user?.phone || "",
        language: profile?.language || "en",
        boatType: profile?.boatType || "Unknown",
      };
      await emergencyApi.sos(payload);
      setMessage("SOS logged and Coast Guard call opened.");
      window.location.href = "tel:1554";
    } catch (error) {
      setMessage(error.message || "SOS failed");
      window.location.href = "tel:1554";
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={trigger}
        disabled={busy}
        className="group inline-flex items-center justify-center gap-2 rounded-full bg-tertiary px-5 py-3 font-black text-white shadow-[0_20px_60px_rgba(124,0,10,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8f0010] active:scale-[0.98] disabled:opacity-60"
      >
        <span className="material-symbols-outlined animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
          emergency
        </span>
        <span>{busy ? "Calling 1554..." : label}</span>
      </button>
      {message ? <span className="text-xs font-bold text-tertiary">{message}</span> : null}
    </div>
  );
}
