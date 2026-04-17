import { useEffect, useMemo, useState } from "react";
import { advisoriesApi, marineApi, zonesApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import EmergencyButton from "../components/EmergencyButton.jsx";
import VoiceReadoutButton from "../components/VoiceReadoutButton.jsx";
import CoastalMap from "../components/CoastalMap.jsx";
import MarineMetricCard from "../components/MarineMetricCard.jsx";

const localeByLanguage = {
  en: "en-IN",
  ta: "ta-IN",
  ml: "ml-IN",
  te: "te-IN",
  or: "or-IN",
};

const textByLanguage = {
  en: {
    todayIn: "Today in",
    riskScore: "Risk score",
    language: "Language",
    safeReturnWindow: "Safe return window",
    noSafeWindow: "No safe return slot currently available",
    safeWindowFallbackNote: "Calculated from forecast wind and wave limits.",
    windSpeed: "Wind speed",
    waveHeight: "Wave height",
    visibility: "Visibility",
    coastalMap: "Coastal map",
    activeRiskOverlay: "Active risk overlay",
    refreshProfile: "Refresh profile",
    liveAdvisory: "Live advisory",
    currentZone: "Current zone",
    safePhone: "Safe phone",
    location: "Location",
    noLiveAdvisory: "No live advisory available.",
    seaStable: "Sea conditions are stable.",
    safetyUnavailable: "Safety update unavailable.",
    yourZone: "your zone",
    coastalZone: "Coastal zone",
    detectLocation: "Complete onboarding to set location",
    go: "GO",
    caution: "CAUTION",
    noGo: "NO-GO",
    safeLabel: "SAFE",
    advisoryLabel: "ADVISORY",
    dangerLabel: "DANGER",
    forecastAge: "Forecast age",
    fresh: "Fresh",
    stale: "Stale",
    expired: "Expired",
    lastUpdated: "Last updated",
    ageMinutes: "min",
  },
  ta: {
    todayIn: "இன்றைய பகுதி",
    riskScore: "ஆபத்து மதிப்பு",
    language: "மொழி",
    safeReturnWindow: "பாதுகாப்பான திரும்பும் நேரம்",
    noSafeWindow: "இப்போது பாதுகாப்பான திரும்பும் நேரம் இல்லை",
    safeWindowFallbackNote: "காற்று மற்றும் அலை வரம்புகளின் அடிப்படையில் கணிக்கப்பட்டது.",
    windSpeed: "காற்றின் வேகம்",
    waveHeight: "அலை உயரம்",
    visibility: "தெரிவுத்திறன்",
    coastalMap: "கடற்கரை வரைபடம்",
    activeRiskOverlay: "செயலில் உள்ள ஆபத்து பகுதி",
    refreshProfile: "சுயவிவரத்தை புதுப்பிக்க",
    liveAdvisory: "நேரடி அறிவுரை",
    currentZone: "தற்போதைய பகுதி",
    safePhone: "பாதுகாப்பு எண்",
    location: "இடம்",
    noLiveAdvisory: "நேரடி அறிவுரை இல்லை.",
    seaStable: "கடல் நிலை தற்போது சீராக உள்ளது.",
    safetyUnavailable: "பாதுகாப்பு தகவல் கிடைக்கவில்லை.",
    yourZone: "உங்கள் பகுதி",
    coastalZone: "கடற்கரை பகுதி",
    detectLocation: "இடத்தை அமைக்க ஒன்போர்டிங் பூர்த்தி செய்யவும்",
    go: "செல்லலாம்",
    caution: "எச்சரிக்கை",
    noGo: "செல்லாதீர்கள்",
    safeLabel: "பாதுகாப்பானது",
    advisoryLabel: "அறிவுரை",
    dangerLabel: "ஆபத்து",
    forecastAge: "கணிப்பு வயது",
    fresh: "புதியது",
    stale: "பழையது",
    expired: "காலாவதியானது",
    lastUpdated: "கடைசியாக புதுப்பித்தது",
    ageMinutes: "நிமி",
  },
  ml: {
    todayIn: "ഇന്നത്തെ പ്രദേശം",
    riskScore: "അപകട സ്കോർ",
    language: "ഭാഷ",
    safeReturnWindow: "സുരക്ഷിത മടങ്ങിവരവ് സമയം",
    noSafeWindow: "ഇപ്പോൾ സുരക്ഷിത മടങ്ങിവരവ് സമയം ലഭ്യമല്ല",
    safeWindowFallbackNote: "കാറ്റ്-തിരമാല പരിധികളെ അടിസ്ഥാനമാക്കിയുള്ള കണക്ക്.",
    windSpeed: "കാറ്റിന്റെ വേഗം",
    waveHeight: "തിരമാല ഉയരം",
    visibility: "ദൃശ്യപരിധി",
    coastalMap: "തീരദേശ ഭൂപടം",
    activeRiskOverlay: "സജീവ അപകട മേഖല",
    refreshProfile: "പ്രൊഫൈൽ പുതുക്കുക",
    liveAdvisory: "ലൈവ് അറിയിപ്പ്",
    currentZone: "നിലവിലെ മേഖല",
    safePhone: "സുരക്ഷാ ഫോൺ",
    location: "സ്ഥലം",
    noLiveAdvisory: "ലൈവ് അറിയിപ്പ് ലഭ്യമല്ല.",
    seaStable: "കടൽ സാഹചര്യം സ്ഥിരതയുള്ളതാണ്.",
    safetyUnavailable: "സുരക്ഷാ വിവരം ലഭ്യമല്ല.",
    yourZone: "നിങ്ങളുടെ മേഖല",
    coastalZone: "തീരദേശ മേഖല",
    detectLocation: "സ്ഥലം സജ്ജമാക്കാൻ ഓൺബോർഡിംഗ് പൂർത്തിയാക്കുക",
    go: "പോകാം",
    caution: "ജാഗ്രത",
    noGo: "പോകരുത്",
    safeLabel: "സുരക്ഷിതം",
    advisoryLabel: "അറിയിപ്പ്",
    dangerLabel: "അപകടം",
    forecastAge: "പ്രവചന പ്രായം",
    fresh: "പുതിയത്",
    stale: "പഴയത്",
    expired: "കാലഹരണപ്പെട്ടത്",
    lastUpdated: "അവസാനം പുതുക്കിയത്",
    ageMinutes: "മിനിറ്റ്",
  },
  te: {
    todayIn: "ఈరోజు ప్రాంతం",
    riskScore: "ప్రమాద స్కోరు",
    language: "భాష",
    safeReturnWindow: "సురక్షితంగా తిరిగిరావాల్సిన సమయం",
    noSafeWindow: "ప్రస్తుతం సురక్షిత తిరుగు సమయం అందుబాటులో లేదు",
    safeWindowFallbackNote: "గాలి, అలల పరిమితుల ఆధారంగా లెక్కించబడింది.",
    windSpeed: "గాలి వేగం",
    waveHeight: "అలల ఎత్తు",
    visibility: "దృశ్యమానం",
    coastalMap: "తీర మ్యాప్",
    activeRiskOverlay: "ప్రస్తుత ప్రమాద పొర",
    refreshProfile: "ప్రొఫైల్ రిఫ్రెష్",
    liveAdvisory: "ప్రత్యక్ష సూచన",
    currentZone: "ప్రస్తుత జోన్",
    safePhone: "భద్రతా ఫోన్",
    location: "స్థానం",
    noLiveAdvisory: "ప్రత్యక్ష సూచన లేదు.",
    seaStable: "సముద్ర పరిస్థితులు ప్రస్తుతం స్థిరంగా ఉన్నాయి.",
    safetyUnavailable: "భద్రతా సమాచారం అందుబాటులో లేదు.",
    yourZone: "మీ ప్రాంతం",
    coastalZone: "తీర ప్రాంతం",
    detectLocation: "స్థానం సెట్ చేయడానికి ఆన్‌బోర్డింగ్ పూర్తి చేయండి",
    go: "వెళ్లండి",
    caution: "జాగ్రత్త",
    noGo: "వెళ్లవద్దు",
    safeLabel: "సురక్షితం",
    advisoryLabel: "సూచన",
    dangerLabel: "ప్రమాదం",
    forecastAge: "ఫోర్‌కాస్ట్ వయస్సు",
    fresh: "తాజా",
    stale: "పాతది",
    expired: "గడువు ముగిసినది",
    lastUpdated: "చివరిసారి నవీకరించిన సమయం",
    ageMinutes: "నిమి",
  },
  or: {
    todayIn: "ଆଜିର ଅଞ୍ଚଳ",
    riskScore: "ଝୁମ୍ପ ସ୍କୋର",
    language: "ଭାଷା",
    safeReturnWindow: "ନିରାପଦ ଫେରା ସମୟ",
    noSafeWindow: "ବର୍ତ୍ତମାନ ନିରାପଦ ଫେରା ସମୟ ଉପଲବ୍ଧ ନାହିଁ",
    safeWindowFallbackNote: "ପବନ ଓ ତରଙ୍ଗ ସୀମା ଆଧାରିତ ଗଣନା।",
    windSpeed: "ପବନ ବେଗ",
    waveHeight: "ତରଙ୍ଗ ଉଚ୍ଚତା",
    visibility: "ଦୃଶ୍ୟତା",
    coastalMap: "ତଟୀୟ ମାନଚିତ୍ର",
    activeRiskOverlay: "ସକ୍ରିୟ ଝୁମ୍ପ ଅଞ୍ଚଳ",
    refreshProfile: "ପ୍ରୋଫାଇଲ ରିଫ୍ରେଶ",
    liveAdvisory: "ଲାଇଭ୍ ପରାମର୍ଶ",
    currentZone: "ବର୍ତ୍ତମାନ ଅଞ୍ଚଳ",
    safePhone: "ନିରାପତ୍ତା ଫୋନ",
    location: "ଅବସ୍ଥାନ",
    noLiveAdvisory: "ଲାଇଭ୍ ପରାମର୍ଶ ଉପଲବ୍ଧ ନାହିଁ।",
    seaStable: "ସମୁଦ୍ର ପରିସ୍ଥିତି ବର୍ତ୍ତମାନ ସ୍ଥିର।",
    safetyUnavailable: "ନିରାପତ୍ତା ସୂଚନା ଉପଲବ୍ଧ ନାହିଁ।",
    yourZone: "ଆପଣଙ୍କ ଅଞ୍ଚଳ",
    coastalZone: "ତଟୀୟ ଅଞ୍ଚଳ",
    detectLocation: "ଅବସ୍ଥାନ ସେଟ୍ ପାଇଁ ଅନବୋର୍ଡିଂ ସମାପ୍ତ କରନ୍ତୁ",
    go: "ଯାଆନ୍ତୁ",
    caution: "ସତର୍କ",
    noGo: "ଯିବେ ନାହିଁ",
    safeLabel: "ନିରାପଦ",
    advisoryLabel: "ପରାମର୍ଶ",
    dangerLabel: "ବିପଦ",
    forecastAge: "ଫୋରକାଷ୍ଟ ବୟସ",
    fresh: "ନୂତନ",
    stale: "ପୁରୁଣା",
    expired: "ମেয়ାଦ ସମାପ୍ତ",
    lastUpdated: "ଶେଷ ଅଦ୍ୟତନ",
    ageMinutes: "ମିନିଟ୍",
  },
};

const riskFallbackMessageByLanguage = {
  en: {
    SAFE: "Sea conditions are stable for routine operations.",
    ADVISORY: "Proceed with caution and monitor weather updates.",
    DANGER: "Dangerous sea conditions. Avoid venturing out.",
  },
  ta: {
    SAFE: "வழக்கமான மீன்பிடி செயல்களுக்கு கடல் நிலை சீராக உள்ளது.",
    ADVISORY: "எச்சரிக்கையுடன் செயல்பட்டு வானிலை அறிவிப்புகளை கவனிக்கவும்.",
    DANGER: "கடல் நிலை ஆபத்தாக உள்ளது. கடலுக்கு செல்லாதீர்கள்.",
  },
  ml: {
    SAFE: "പതിവ് പ്രവർത്തനങ്ങൾക്ക് കടൽ സ്ഥിതി സ്ഥിരമാണ്.",
    ADVISORY: "ജാഗ്രതയോടെ തുടരുക, കാലാവസ്ഥാ അപ്ഡേറ്റുകൾ ശ്രദ്ധിക്കുക.",
    DANGER: "കടൽ സ്ഥിതി അപകടകരം. കടലിലേക്കു പോകരുത്.",
  },
  te: {
    SAFE: "సాధారణ కార్యకలాపాలకు సముద్ర పరిస్థితులు స్థిరంగా ఉన్నాయి.",
    ADVISORY: "జాగ్రత్తగా కొనసాగి వాతావరణ సమాచారాన్ని గమనించండి.",
    DANGER: "సముద్ర పరిస్థితులు ప్రమాదకరం. సముద్రంలోకి వెళ్లవద్దు.",
  },
  or: {
    SAFE: "ସାଧାରଣ କାର୍ଯ୍ୟ ପାଇଁ ସମୁଦ୍ର ପରିସ୍ଥିତି ସ୍ଥିର ଅଛି।",
    ADVISORY: "ସତର୍କ ରୁହନ୍ତୁ ଏବଂ ପାଣିପାଗ ସୂଚନା ନଜରରେ ରଖନ୍ତୁ।",
    DANGER: "ସମୁଦ୍ର ପରିସ୍ଥିତି ବିପଦଜନକ। ସମୁଦ୍ରକୁ ଯିବେ ନାହିଁ।",
  },
};

const formatDateTime = (value, language) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeByLanguage[language] || "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export default function SafeDashboard() {
  const { profile, refreshProfile, user } = useAuth();
  const [zone, setZone] = useState(null);
  const [marine, setMarine] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeZoneId = profile?.primaryZoneId || "zone-palk-01";

  useEffect(() => {
    const load = async () => {
      try {
        const [zoneList, marineData, advisoryData] = await Promise.all([
          zonesApi.getAll(),
          marineApi.overview(activeZoneId),
          advisoriesApi.current(activeZoneId, profile?.language || "en"),
        ]);
        setZones(Array.isArray(zoneList) ? zoneList : zoneList.zones || []);
        setZone(marineData.zone || marineData);
        setMarine(marineData.observation || marineData.conditions || marineData);
        setAdvisory(advisoryData);
      } catch (_error) {
        setZones([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeZoneId, profile?.language]);

  const currentLanguageLabel = useMemo(() => {
    const current = {
      en: "English",
      ta: "Tamil",
      ml: "Malayalam",
      te: "Telugu",
      or: "Odia",
    };
    return current[profile?.language || "en"] || "English";
  }, [profile?.language]);

  const activeLanguage = profile?.language || "en";
  const uiText = textByLanguage[activeLanguage] || textByLanguage.en;

  const riskLevelForText = advisory?.level || "SAFE";
  const fetchedAtMs = new Date(advisory?.fetchedAt || 0).getTime();
  const ageMinutes = Number.isNaN(fetchedAtMs) ? 0 : Math.max(0, Math.floor((Date.now() - fetchedAtMs) / 60000));
  const freshnessStage = ageMinutes > 180 ? "expired" : ageMinutes > 60 ? "stale" : "fresh";
  const effectiveRiskLevel = freshnessStage === "expired" ? "DANGER" : freshnessStage === "stale" && riskLevelForText === "SAFE" ? "ADVISORY" : riskLevelForText;
  const localizedSummary =
    riskFallbackMessageByLanguage[activeLanguage]?.[effectiveRiskLevel] ||
    riskFallbackMessageByLanguage.en[effectiveRiskLevel] ||
    uiText.noLiveAdvisory;
  const spokenMessage = localizedSummary || uiText.safetyUnavailable;
  const activeZone = zones.find((item) => item.id === activeZoneId) || zone;
  const activeLat = Number(profile?.latitude) || Number(activeZone?.center?.lat) || 9.62;
  const activeLng = Number(profile?.longitude) || Number(activeZone?.center?.lng) || 79.31;

  const safeWindow = advisory?.safeReturnWindowEstimate || null;
  const safeWindowStart = formatDateTime(safeWindow?.startAt || advisory?.safeReturnWindow, activeLanguage);
  const safeWindowEnd = formatDateTime(safeWindow?.endAt, activeLanguage);
  const safeWindowTitle = safeWindow?.available && freshnessStage !== "expired" ? `${safeWindowStart}${safeWindowEnd ? ` - ${safeWindowEnd}` : ""}` : uiText.noSafeWindow;
  const safeWindowNote = uiText.safeWindowFallbackNote;

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const riskLevel = effectiveRiskLevel;
  const riskTone = riskLevel === "SAFE" ? "text-primary" : riskLevel === "ADVISORY" ? "text-secondary" : "text-tertiary";
  const recommendationText =
    riskLevel === "SAFE" ? uiText.go : riskLevel === "ADVISORY" ? uiText.caution : uiText.noGo;
  const riskLabelText =
    riskLevel === "SAFE" ? uiText.safeLabel : riskLevel === "ADVISORY" ? uiText.advisoryLabel : uiText.dangerLabel;

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#00450d,#1b5e20_45%,#7c000a_140%)] p-6 text-white shadow-[0_25px_80px_rgba(0,69,13,0.3)] md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-white/65">{uiText.todayIn} {zone?.name || uiText.yourZone}</p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
            {recommendationText}
          </h2>
          <p className="mt-4 max-w-2xl text-base font-medium text-white/90 md:text-lg">
            {spokenMessage || uiText.seaStable}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <VoiceReadoutButton
              text={spokenMessage || uiText.safetyUnavailable}
              language={activeLanguage}
              className="!m-0 !bg-white !text-primary"
            />
            <EmergencyButton compact />
          </div>
        </section>

        <section className="grid gap-4">
          <div className="fade-in rounded-[28px] bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">{uiText.riskScore}</p>
            <div className={`mt-2 text-5xl font-black ${riskTone}`}>{advisory?.riskScore ?? 0}</div>
            <p className="mt-2 text-sm font-bold text-on-surface-variant">{uiText.language}: {currentLanguageLabel}</p>
            <p className="mt-1 text-xs font-bold text-on-surface-variant">
              {uiText.forecastAge}: {freshnessStage === "fresh" ? uiText.fresh : freshnessStage === "stale" ? uiText.stale : uiText.expired} ({ageMinutes} {uiText.ageMinutes})
            </p>
          </div>

          <div className="fade-in-delay rounded-[28px] bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">{uiText.safeReturnWindow}</p>
            <p className="mt-2 text-2xl font-black text-primary">
              {safeWindowTitle}
            </p>
            <p className="mt-2 text-sm font-medium text-on-surface-variant">
              {safeWindowNote}
            </p>
            <p className="mt-2 text-xs font-bold text-on-surface-variant">
              {uiText.lastUpdated}: {formatDateTime(advisory?.fetchedAt, activeLanguage) || "-"}
            </p>
          </div>
        </section>
      </div>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <MarineMetricCard
          title={uiText.windSpeed}
          value={marine?.windSpeedKmph || marine?.windSpeed || 0}
          unit="km/h"
          icon="air"
          max={80}
          cautionFrom={45}
          dangerFrom={75}
        />
        <MarineMetricCard
          title={uiText.waveHeight}
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
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] bg-white p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-outline">{uiText.coastalMap}</p>
              <h3 className="text-2xl font-black text-on-surface">{uiText.activeRiskOverlay}</h3>
            </div>
            <button
              type="button"
              onClick={() => refreshProfile()}
              className="rounded-full bg-surface-container-highest px-4 py-2 text-sm font-black transition hover:-translate-y-0.5"
            >
              {uiText.refreshProfile}
            </button>
          </div>
          <div className="space-y-3">
            <CoastalMap lat={activeLat} lng={activeLng} zoom={9} title={uiText.coastalMap} />
            <div className="rounded-2xl bg-surface-container-low p-3 text-sm font-bold text-on-surface-variant">
              {activeZone?.name || zone?.name || uiText.coastalZone}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-outline">{uiText.liveAdvisory}</p>
          <div className="mt-3 rounded-[28px] bg-surface-container-low p-5">
            <p className="text-sm font-black uppercase text-primary">{riskLabelText}</p>
            <p className="mt-3 text-base font-medium text-on-surface-variant">
              {localizedSummary}
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <p className="text-xs font-black uppercase text-outline">{uiText.currentZone}</p>
              <p className="mt-1 font-bold">{zone?.name || "Palk Strait"}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <p className="text-xs font-black uppercase text-outline">{uiText.safePhone}</p>
              <p className="mt-1 font-bold">{profile?.phone || profile?.safetyPhone || user?.phone || "-"}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <p className="text-xs font-black uppercase text-outline">{uiText.location}</p>
              <p className="mt-1 font-bold">{profile?.locationLabel || uiText.detectLocation}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
