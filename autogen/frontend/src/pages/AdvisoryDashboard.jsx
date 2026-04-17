import { useEffect, useState } from "react";
import { advisoriesApi, marineApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import VoiceReadoutButton from "../components/VoiceReadoutButton.jsx";
import MarineMetricCard from "../components/MarineMetricCard.jsx";

const textByLanguage = {
  en: {
    caution: "Proceed with caution",
    title: "Advisory",
    read: "Read aloud",
    wind: "Wind",
    wave: "Wave",
    visibility: "Visibility",
    fallback: "Moderate conditions expected.",
  },
  ta: {
    caution: "எச்சரிக்கையுடன் செல்லவும்",
    title: "அறிவுரை",
    read: "ஒலியாக வாசிக்க",
    wind: "காற்று",
    wave: "அலை",
    visibility: "தெரிவுத்திறன்",
    fallback: "மிதமான கடல் நிலை எதிர்பார்க்கப்படுகிறது.",
  },
  ml: {
    caution: "ജാഗ്രതയോടെ തുടരുക",
    title: "അറിയിപ്പ്",
    read: "ശബ്ദമായി വായിക്കുക",
    wind: "കാറ്റ്",
    wave: "തിരമാല",
    visibility: "ദൃശ്യത",
    fallback: "മിതമായ കടൽ സാഹചര്യങ്ങൾ പ്രതീക്ഷിക്കുന്നു.",
  },
  te: {
    caution: "జాగ్రత్తగా కొనసాగండి",
    title: "సూచన",
    read: "శబ్దంగా చదవు",
    wind: "గాలి",
    wave: "అల",
    visibility: "దృశ్యమానం",
    fallback: "మధ్యస్థ పరిస్థితులు ఉండే అవకాశం ఉంది.",
  },
  or: {
    caution: "ସତର୍କ ହୋଇ ଯାଆନ୍ତୁ",
    title: "ପରାମର୍ଶ",
    read: "ଉଚ୍ଚାରଣ ପଢନ୍ତୁ",
    wind: "ପବନ",
    wave: "ତରଙ୍ଗ",
    visibility: "ଦୃଶ୍ୟତା",
    fallback: "ମଧ୍ୟମ ସମୁଦ୍ର ପରିସ୍ଥିତି ଆଶା କରାଯାଉଛି।",
  },
};

const advisoryNarrationByLanguage = {
  en: (summary, marine) => `${summary} Wind ${marine?.windSpeedKmph || marine?.windSpeed || 0} kilometers per hour. Wave height ${marine?.waveHeightM || marine?.waveHeight || 0} meters. Visibility ${marine?.visibilityKm || marine?.visibility || 0} kilometers.`,
  ta: (summary, marine) => `${summary} காற்று வேகம் ${marine?.windSpeedKmph || marine?.windSpeed || 0} கிலோமீட்டர் প্রতি மணி. அலை உயரம் ${marine?.waveHeightM || marine?.waveHeight || 0} மீட்டர். தெரிவுத்திறன் ${marine?.visibilityKm || marine?.visibility || 0} கிலோமீட்டர்.`,
  ml: (summary, marine) => `${summary} കാറ്റിന്റെ വേഗം ${marine?.windSpeedKmph || marine?.windSpeed || 0} കിലോമീറ്റർ മണിക്കൂറിൽ. തിരമാല ഉയരം ${marine?.waveHeightM || marine?.waveHeight || 0} മീറ്റർ. ദൃശ്യത ${marine?.visibilityKm || marine?.visibility || 0} കിലോമീറ്റർ.`,
  te: (summary, marine) => `${summary} గాలి వేగం ${marine?.windSpeedKmph || marine?.windSpeed || 0} కిలోమీటర్లు గంటకు. అల ఎత్తు ${marine?.waveHeightM || marine?.waveHeight || 0} మీటర్లు. దృశ్యమానం ${marine?.visibilityKm || marine?.visibility || 0} కిలోమీటర్లు.`,
  or: (summary, marine) => `${summary} ପବନ ବେଗ ${marine?.windSpeedKmph || marine?.windSpeed || 0} କିମି ପ୍ରତି ଘଣ୍ଟା। ତରଙ୍ଗ ଉଚ୍ଚତା ${marine?.waveHeightM || marine?.waveHeight || 0} ମିଟର। ଦୃଶ୍ୟତା ${marine?.visibilityKm || marine?.visibility || 0} କିମି।`,
};

export default function AdvisoryDashboard() {
  const { profile } = useAuth();
  const [marine, setMarine] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const activeLanguage = profile?.language || "en";
  const uiText = textByLanguage[activeLanguage] || textByLanguage.en;

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

  const summary = uiText.fallback;
  const narration = (advisoryNarrationByLanguage[activeLanguage] || advisoryNarrationByLanguage.en)(summary, marine);

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="rounded-[32px] bg-[linear-gradient(135deg,#f9a825,#ffddb5)] p-6 shadow-lg md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-on-surface/60">{uiText.caution}</p>
        <h1 className="mt-2 text-4xl font-black uppercase text-on-surface">{uiText.title}</h1>
        <p className="mt-3 max-w-2xl text-lg font-medium text-on-surface">
          {summary}
        </p>
        <VoiceReadoutButton text={narration} language={activeLanguage} className="mt-5 !bg-white !text-primary" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <MarineMetricCard
          title={uiText.wind}
          value={marine?.windSpeedKmph || marine?.windSpeed || 0}
          unit="km/h"
          icon="air"
          max={80}
          cautionFrom={45}
          dangerFrom={75}
        />
        <MarineMetricCard
          title={uiText.wave}
          value={marine?.waveHeightM || marine?.waveHeight || 0}
          unit="m"
          icon="waves"
          max={6}
          cautionFrom={45}
          dangerFrom={75}
        />
        <MarineMetricCard
          title={uiText.visibility}
          value={marine?.visibilityKm || marine?.visibility || 0}
          unit="km"
          icon="visibility"
          max={12}
          cautionFrom={30}
          dangerFrom={60}
          higherIsRiskier={false}
        />
      </div>
    </div>
  );
}
