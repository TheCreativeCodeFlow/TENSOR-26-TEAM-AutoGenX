import { useState } from "react";
import { emergencyApi } from "../services/api.js";

const coastGuardNumber = "1554";

const SOSButton = ({ profile, compact = false, className = "" }) => {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const handleSos = async () => {
    if (busy) return;

    setBusy(true);
    setStatus("");

    try {
      const lat = Number(profile?.location?.lat) || 9.62;
      const lng = Number(profile?.location?.lng) || 79.31;
      const zoneId = profile?.primaryZoneId || "zone-palk-01";

      await emergencyApi.sos({
        zoneId,
        location: { lat, lng },
        distressType: "MEDICAL_OR_WEATHER",
        message: `SOS raised by ${profile?.fullName || "Fisher"} from app.`,
      });

      setStatus("SOS sent. Calling Coast Guard 1554.");
      window.location.href = `tel:${coastGuardNumber}`;
    } catch (error) {
      setStatus(error.message || "SOS failed. Try calling 1554 directly.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`sos-wrap ${className}`}>
      <button
        type="button"
        className={`sos-btn ${compact ? "sos-btn-compact" : ""}`}
        onClick={handleSos}
        disabled={busy}
      >
        <span className="material-symbols-outlined">emergency</span>
        <span>{busy ? "Sending..." : "SOS 1554"}</span>
      </button>
      {status ? <p className="sos-status">{status}</p> : null}
    </div>
  );
};

export default SOSButton;
