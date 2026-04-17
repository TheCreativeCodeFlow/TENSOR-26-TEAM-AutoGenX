import { useEffect, useState } from "react";
import { alertsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { listSafetyEvents } from "../utils/safety-events.js";

const textByLanguage = {
  en: { history: "History", previousAlerts: "Previous alerts", noAlerts: "No alerts recorded yet.", server: "Server", offline: "Offline" },
  ta: { history: "வரலாறு", previousAlerts: "முந்தைய எச்சரிக்கைகள்", noAlerts: "இன்னும் எச்சரிக்கைகள் பதிவாகவில்லை.", server: "சேவையகம்", offline: "ஆஃப்லைன்" },
  ml: { history: "ചരിത്രം", previousAlerts: "മുമ്പത്തെ മുന്നറിയിപ്പുകൾ", noAlerts: "ഇതുവരെ മുന്നറിയിപ്പുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല.", server: "സെർവർ", offline: "ഓഫ്‌ലൈൻ" },
  te: { history: "చరిత్ర", previousAlerts: "మునుపటి హెచ్చరికలు", noAlerts: "ఇప్పటివరకు హెచ్చరికలు నమోదు కాలేదు.", server: "సర్వర్", offline: "ఆఫ్‌లైన్" },
  or: { history: "ଇତିହାସ", previousAlerts: "ପୂର୍ବ ସତର୍କତା", noAlerts: "ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ସତର୍କତା ରେକର୍ଡ ହୋଇନାହିଁ।", server: "ସର୍ଭର", offline: "ଅଫଲାଇନ" },
};

export default function HistoryLog() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [offlineEvents, setOfflineEvents] = useState([]);
  const activeLanguage = profile?.language || "en";
  const uiText = textByLanguage[activeLanguage] || textByLanguage.en;

  useEffect(() => {
    const load = async () => {
      const data = await alertsApi.getAll({ zoneId: profile?.primaryZoneId || "zone-palk-01" });
      setAlerts(Array.isArray(data) ? data : data.items || []);
      setOfflineEvents(listSafetyEvents());
    };
    load();
  }, [profile?.primaryZoneId]);

  const merged = [
    ...offlineEvents.map((event) => ({
      id: event.id,
      level: event.level,
      message: event.message,
      createdAt: event.createdAt,
      source: uiText.offline,
    })),
    ...alerts.map((alert) => ({
      id: alert.id,
      level: alert.level || alert.severity,
      message: alert.message?.[profile?.language || "en"] || alert.message?.en || alert.message,
      createdAt: alert.createdAt || alert.date || "",
      source: uiText.server,
    })),
  ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="rounded-[32px] bg-white p-6 shadow-lg md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">{uiText.history}</p>
        <h1 className="mt-2 text-3xl font-black text-on-surface">{uiText.previousAlerts}</h1>
        <div className="mt-6 space-y-4">
          {merged.map((alert) => (
            <div key={alert.id} className="rounded-[24px] border border-surface-container-highest p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black uppercase text-primary">{alert.level}</p>
                  <p className="text-sm text-on-surface-variant">{alert.message}</p>
                  <p className="mt-2 inline-flex rounded-full bg-surface-container-highest px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-outline">
                    {alert.source}
                  </p>
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-outline">
                  {alert.createdAt || ""}
                </span>
              </div>
            </div>
          ))}
          {!merged.length ? <p className="text-sm font-medium text-on-surface-variant">{uiText.noAlerts}</p> : null}
        </div>
      </div>
    </div>
  );
}
