import { useEffect, useState } from "react";
import { alertsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function HistoryLog() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await alertsApi.getAll({ zoneId: profile?.primaryZoneId || "zone-palk-01" });
      setAlerts(Array.isArray(data) ? data : data.items || []);
    };
    load();
  }, [profile?.primaryZoneId]);

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="rounded-[32px] bg-white p-6 shadow-lg md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">History</p>
        <h1 className="mt-2 text-3xl font-black text-on-surface">Previous alerts</h1>
        <div className="mt-6 space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-[24px] border border-surface-container-highest p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black uppercase text-primary">{alert.level || alert.severity}</p>
                  <p className="text-sm text-on-surface-variant">{alert.message?.[profile?.language || "en"] || alert.message?.en || alert.message}</p>
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-outline">
                  {alert.createdAt || alert.date || ""}
                </span>
              </div>
            </div>
          ))}
          {!alerts.length ? <p className="text-sm font-medium text-on-surface-variant">No alerts recorded yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
