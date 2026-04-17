import { useEffect, useState } from "react";
import { advisoriesApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import EmergencyButton from "../components/EmergencyButton.jsx";
import VoiceReadoutButton from "../components/VoiceReadoutButton.jsx";

const textByLanguage = {
  en: { warning: "Cyclone warning", title: "Stay in port", call: "Call 1554", fallback: "Cyclone-linked conditions are dangerous." },
  ta: { warning: "புயல் எச்சரிக்கை", title: "துறையில் தங்குங்கள்", call: "1554 அழைக்கவும்", fallback: "புயல் காரணமாக கடல் நிலை ஆபத்தாக உள்ளது." },
  ml: { warning: "ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പ്", title: "തുറമുഖത്ത് തന്നെ തുടരുക", call: "1554 ന് വിളിക്കുക", fallback: "ചുഴലിക്കാറ്റ് കാരണം കടൽ സാഹചര്യം അപകടകരമാണ്." },
  te: { warning: "చండమಾರುత హెచ్చరిక", title: "పోర్ట్ లోనే ఉండండి", call: "1554 కు కాల్ చేయండి", fallback: "చండమారుత పరిస్థితుల వల్ల సముద్రం ప్రమాదకరం." },
  or: { warning: "ଘୂର୍ଣ୍ଣିବାତ୍ୟା ସତର୍କତା", title: "ବନ୍ଦରରେ ରୁହନ୍ତୁ", call: "1554 କୁ ଫୋନ କରନ୍ତୁ", fallback: "ଘୂର୍ଣ୍ଣିବାତ୍ୟା କାରଣରୁ ସମୁଦ୍ର ପରିସ୍ଥିତି ବିପଦଜନକ।" },
};

export default function CycloneDashboard() {
  const { profile } = useAuth();
  const [advisory, setAdvisory] = useState(null);
  const activeLanguage = profile?.language || "en";
  const uiText = textByLanguage[activeLanguage] || textByLanguage.en;

  useEffect(() => {
    const load = async () => {
      const zoneId = profile?.primaryZoneId || "zone-odisha-01";
      setAdvisory(await advisoriesApi.current(zoneId, profile?.language || "en"));
    };
    load();
  }, [profile?.language, profile?.primaryZoneId]);

  const summary = uiText.fallback;

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="rounded-[32px] bg-[linear-gradient(135deg,#330000,#7c000a)] p-6 text-white shadow-lg md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-white/70">{uiText.warning}</p>
        <h1 className="mt-2 text-4xl font-black uppercase">{uiText.title}</h1>
        <p className="mt-3 max-w-2xl text-lg font-medium text-white/90">
          {summary}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <VoiceReadoutButton text={summary} language={activeLanguage} className="!bg-white !text-tertiary" />
          <EmergencyButton compact />
          <a href="tel:1554" className="rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-tertiary">
            {uiText.call}
          </a>
        </div>
      </div>
    </div>
  );
}
