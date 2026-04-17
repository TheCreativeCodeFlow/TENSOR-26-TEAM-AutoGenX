import { useEffect, useState } from "react";
import { advisoriesApi, zonesApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import CoastalMap from "../components/CoastalMap.jsx";
import VoiceReadoutButton from "../components/VoiceReadoutButton.jsx";

const textByLanguage = {
  en: {
    map: "Map",
    overlay: "Danger zone overlay",
    liveMapTitle: "Live coastal location map",
    legend: "Legend",
    riskSummary: "Risk summary",
    noAdvisory: "No active advisory.",
    locationPending: "Location pending",
    go: "GO",
    caution: "CAUTION",
    noGo: "NO-GO",
    safeLabel: "SAFE",
    advisoryLabel: "ADVISORY",
    dangerLabel: "DANGER",
    safeMessage: "Sea conditions are stable for routine operations.",
    advisoryMessage: "Proceed with caution and monitor weather updates.",
    dangerMessage: "Dangerous sea conditions. Avoid venturing out.",
  },
  ta: {
    map: "வரைபடம்",
    overlay: "ஆபத்து பகுதி வரைபடம்",
    liveMapTitle: "நேரடி கடற்கரை இருப்பிடம் வரைபடம்",
    legend: "விளக்கம்",
    riskSummary: "ஆபத்து சுருக்கம்",
    noAdvisory: "செயலில் அறிவுரை இல்லை.",
    locationPending: "இடம் நிலுவையில்",
    go: "செல்லலாம்",
    caution: "எச்சரிக்கை",
    noGo: "செல்லாதீர்கள்",
    safeLabel: "பாதுகாப்பானது",
    advisoryLabel: "அறிவுரை",
    dangerLabel: "ஆபத்து",
    safeMessage: "வழக்கமான மீன்பிடி செயல்களுக்கு கடல் நிலை சீராக உள்ளது.",
    advisoryMessage: "எச்சரிக்கையுடன் செயல்பட்டு வானிலை அறிவிப்புகளை கவனிக்கவும்.",
    dangerMessage: "கடல் நிலை ஆபத்தாக உள்ளது. கடலுக்கு செல்லாதீர்கள்.",
  },
  ml: {
    map: "മാപ്",
    overlay: "അപകട മേഖല മാപ്",
    liveMapTitle: "ലൈവ് തീരദേശ സ്ഥാനം മാപ്",
    legend: "ലെജൻഡ്",
    riskSummary: "അപകട സാരാംശം",
    noAdvisory: "സജീവ അറിയിപ്പ് ഇല്ല.",
    locationPending: "സ്ഥലം ബാക്കി",
    go: "പോകാം",
    caution: "ജാഗ്രത",
    noGo: "പോകരുത്",
    safeLabel: "സുരക്ഷിതം",
    advisoryLabel: "അറിയിപ്പ്",
    dangerLabel: "അപകടം",
    safeMessage: "പതിവ് പ്രവർത്തനങ്ങൾക്ക് കടൽ സ്ഥിതി സ്ഥിരമാണ്.",
    advisoryMessage: "ജാഗ്രതയോടെ തുടരുക, കാലാവസ്ഥാ അപ്ഡേറ്റുകൾ ശ്രദ്ധിക്കുക.",
    dangerMessage: "കടൽ സ്ഥിതി അപകടകരം. കടലിലേക്കു പോകരുത്.",
  },
  te: {
    map: "మ్యాప్",
    overlay: "ప్రమాద జోన్ మ్యాప్",
    liveMapTitle: "ప్రత్యక్ష తీర ప్రాంత స్థానం మ్యాప్",
    legend: "లెజెండ్",
    riskSummary: "ప్రమాద సారాంశం",
    noAdvisory: "ప్రస్తుతం సూచన లేదు.",
    locationPending: "స్థానం ఇంకా లేదు",
    go: "వెళ్లండి",
    caution: "జాగ్రత్త",
    noGo: "వెళ్లవద్దు",
    safeLabel: "సురక్షితం",
    advisoryLabel: "సూచన",
    dangerLabel: "ప్రమాదం",
    safeMessage: "సాధారణ కార్యకలాపాలకు సముద్ర పరిస్థితులు స్థిరంగా ఉన్నాయి.",
    advisoryMessage: "జాగ్రత్తగా కొనసాగి వాతావరణ సమాచారాన్ని గమనించండి.",
    dangerMessage: "సముద్ర పరిస్థితులు ప్రమాదకరం. సముద్రంలోకి వెళ్లవద్దు.",
  },
  or: {
    map: "ମାନଚିତ୍ର",
    overlay: "ବିପଦ ଅଞ୍ଚଳ ମାନଚିତ୍ର",
    liveMapTitle: "ଲାଇଭ୍ ତଟୀୟ ଅବସ୍ଥାନ ମାନଚିତ୍ର",
    legend: "ସୂଚିକା",
    riskSummary: "ଝୁମ୍ପ ସାରାଂଶ",
    noAdvisory: "ସକ୍ରିୟ ପରାମର୍ଶ ନାହିଁ।",
    locationPending: "ଅବସ୍ଥାନ ଅପେକ୍ଷାରତ",
    go: "ଯାଆନ୍ତୁ",
    caution: "ସତର୍କ",
    noGo: "ଯିବେ ନାହିଁ",
    safeLabel: "ନିରାପଦ",
    advisoryLabel: "ପରାମର୍ଶ",
    dangerLabel: "ବିପଦ",
    safeMessage: "ସାଧାରଣ କାର୍ଯ୍ୟ ପାଇଁ ସମୁଦ୍ର ପରିସ୍ଥିତି ସ୍ଥିର ଅଛି।",
    advisoryMessage: "ସତର୍କ ରୁହନ୍ତୁ ଏବଂ ପାଣିପାଗ ସୂଚନା ନଜରରେ ରଖନ୍ତୁ।",
    dangerMessage: "ସମୁଦ୍ର ପରିସ୍ଥିତି ବିପଦଜନକ। ସମୁଦ୍ରକୁ ଯିବେ ନାହିଁ।",
  },
};

export default function MapRiskZones() {
  const { profile } = useAuth();
  const [zones, setZones] = useState([]);
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const activeLanguage = profile?.language || "en";
  const uiText = textByLanguage[activeLanguage] || textByLanguage.en;

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

  const riskLevel = advisory?.level || "SAFE";
  const summary =
    riskLevel === "SAFE"
      ? uiText.safeMessage
      : riskLevel === "ADVISORY"
        ? uiText.advisoryMessage
        : uiText.dangerMessage;
  const riskLabelText =
    riskLevel === "SAFE"
      ? uiText.safeLabel
      : riskLevel === "ADVISORY"
        ? uiText.advisoryLabel
        : uiText.dangerLabel;
  const recommendationText =
    riskLevel === "SAFE"
      ? uiText.go
      : riskLevel === "ADVISORY"
        ? uiText.caution
        : uiText.noGo;

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="slide-up overflow-hidden rounded-[32px] bg-white p-4 shadow-lg md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">{uiText.map}</p>
              <h2 className="text-3xl font-black text-on-surface">{uiText.overlay}</h2>
            </div>
            <span className="rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
              {riskLabelText}
            </span>
          </div>

          <CoastalMap
            lat={Number(profile?.latitude) || 9.62}
            lng={Number(profile?.longitude) || 79.31}
            zoom={9}
            title={uiText.liveMapTitle}
          />
          <div className="mt-3 rounded-2xl bg-surface-container-low p-4 text-sm font-bold text-on-surface-variant">
            {profile?.locationLabel || uiText.locationPending}
          </div>
        </section>

        <section className="fade-in space-y-4">
          <div className="rounded-[28px] bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">{uiText.legend}</p>
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
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">{uiText.riskSummary}</p>
            <p className="mt-3 text-2xl font-black text-on-surface">{recommendationText}</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {summary}
            </p>
            <VoiceReadoutButton
              className="mt-4"
              language={activeLanguage}
              text={summary}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
