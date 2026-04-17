import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { pushSafetyEvent } from "../utils/safety-events.js";
import { speak } from "../utils/voice.js";

const ZONES_CACHE_KEY = "offline_zones_cache_v1";
const TRIP_STATE_KEY = "offline_trip_state_v1";
const INDIAN_WATERS_POLYGON = [
  [6.5, 67.0],
  [6.5, 74.0],
  [8.0, 78.5],
  [12.0, 84.0],
  [17.5, 89.5],
  [21.0, 92.5],
  [23.0, 93.6],
  [24.5, 92.0],
  [23.5, 88.0],
  [20.5, 85.0],
  [19.0, 72.0],
  [17.0, 68.5],
  [12.0, 67.0],
  [6.5, 67.0],
];

const langText = {
  en: {
    near: "Boundary nearby. Turn toward shore.",
    crossed: "You crossed Indian waters. Turn back now.",
    stale: "Weather update is old. Return if unsure.",
    noGps: "GPS unavailable. Use VHF Channel 16 and call 1554 when network returns.",
    bannerNear: "Boundary nearby",
    bannerCrossed: "Boundary crossed",
    bannerStale: "Forecast stale",
    bannerNoGps: "GPS unavailable",
    monitorTitle: "Monitoring",
    monitorMessage: "Offline safety guard is active.",
    network: "Network",
    online: "Online",
    offline: "Offline",
    gps: "GPS",
    active: "Active",
    waiting: "Waiting",
    queuedSos: "Queued SOS",
    forecast: "Forecast",
    cached: "Cached",
    unavailable: "Unavailable",
    returnToShore: "Return to shore",
    direction: "Direction",
    distance: "Distance",
    unavailableDirection: "Unavailable",
  },
  ta: {
    near: "எல்லைக்கு அருகில் உள்ளீர்கள். கரைக்கு திரும்புங்கள்.",
    crossed: "இந்திய கடல் எல்லையை கடந்துவிட்டீர்கள். உடனே திரும்புங்கள்.",
    stale: "வானிலை தகவல் பழையது. சந்தேகம் இருந்தால் திரும்புங்கள்.",
    noGps: "GPS கிடைக்கவில்லை. VHF Channel 16 பயன்படுத்தி, நெட்வொர்க் வந்ததும் 1554 அழைக்கவும்.",
    bannerNear: "எல்லை அருகில்",
    bannerCrossed: "எல்லை கடந்தது",
    bannerStale: "பழைய கணிப்பு",
    bannerNoGps: "GPS இல்லை",
    monitorTitle: "கண்காணிப்பு",
    monitorMessage: "ஆஃப்லைன் பாதுகாப்பு கண்காணிப்பு செயல்பாட்டில் உள்ளது.",
    network: "நெட்வொர்க்",
    online: "இணைந்தது",
    offline: "இணைப்பு இல்லை",
    gps: "GPS",
    active: "செயலில்",
    waiting: "காத்திருக்கிறது",
    queuedSos: "வரிசை SOS",
    forecast: "கணிப்பு",
    cached: "சேமிப்பு உள்ளது",
    unavailable: "இல்லை",
    returnToShore: "கரைக்கு திரும்பும் வழி",
    direction: "திசை",
    distance: "தூரம்",
    unavailableDirection: "கிடைக்கவில்லை",
  },
  ml: {
    near: "അതിരിന് സമീപമാണ്. കരയിലേക്ക് തിരിയുക.",
    crossed: "ഇന്ത്യൻ ജലപരിധി കടന്നു. ഉടൻ തിരിച്ചു പോവുക.",
    stale: "കാലാവസ്ഥാ വിവരം പഴയതാണ്. സംശയമുണ്ടെങ്കിൽ മടങ്ങുക.",
    noGps: "GPS ലഭ്യമല്ല. VHF ചാനൽ 16 ഉപയോഗിക്കുക, നെറ്റ് ലഭിക്കുമ്പോൾ 1554 വിളിക്കുക.",
    bannerNear: "അതിര് സമീപം",
    bannerCrossed: "അതിര് കടന്നു",
    bannerStale: "പഴയ പ്രവചനം",
    bannerNoGps: "GPS ലഭ്യമല്ല",
    monitorTitle: "നിരീക്ഷണം",
    monitorMessage: "ഓഫ്‌ലൈൻ സുരക്ഷാ നിരീക്ഷണം പ്രവർത്തനത്തിലുണ്ട്.",
    network: "നെറ്റ്‌വർക്ക്",
    online: "ഓൺലൈൻ",
    offline: "ഓഫ്‌ലൈൻ",
    gps: "GPS",
    active: "സജീവം",
    waiting: "കാത്തിരിക്കുന്നു",
    queuedSos: "ക്യൂ ചെയ്‌ത SOS",
    forecast: "പ്രവചനം",
    cached: "കാഷ് ചെയ്‌തത്",
    unavailable: "ലഭ്യമല്ല",
    returnToShore: "കരയിലേക്ക് മടങ്ങുക",
    direction: "ദിശ",
    distance: "ദൂരം",
    unavailableDirection: "ലഭ്യമല്ല",
  },
  te: {
    near: "సరిహద్దు దగ్గరలో ఉన్నారు. ఒడ్డుకు తిరగండి.",
    crossed: "భారత సముద్ర జలాలు దాటారు. వెంటనే వెనక్కి తిరగండి.",
    stale: "వాతావరణ సమాచారం పాతది. అనుమానం ఉంటే తిరిగి రండి.",
    noGps: "GPS అందుబాటులో లేదు. VHF ఛానల్ 16 వాడండి, నెట్ వచ్చినప్పుడు 1554 కు కాల్ చేయండి.",
    bannerNear: "సరిహద్దు దగ్గర",
    bannerCrossed: "సరిహద్దు దాటారు",
    bannerStale: "పాత ఫోర్‌కాస్ట్",
    bannerNoGps: "GPS లేదు",
    monitorTitle: "మానిటరింగ్",
    monitorMessage: "ఆఫ్‌లైన్ భద్రతా పర్యవేక్షణ యాక్టివ్‌లో ఉంది.",
    network: "నెట్‌వర్క్",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    gps: "GPS",
    active: "సక్రియం",
    waiting: "వేచి ఉంది",
    queuedSos: "క్యూడ్ SOS",
    forecast: "ఫోర్‌కాస్ట్",
    cached: "క్యాష్‌లో ఉంది",
    unavailable: "అందుబాటులో లేదు",
    returnToShore: "ఒడ్డుకు తిరిగే దారి",
    direction: "దిశ",
    distance: "దూరం",
    unavailableDirection: "అందుబాటులో లేదు",
  },
  or: {
    near: "ସୀମା ନିକଟରେ ଅଛନ୍ତି। କୂଳକୁ ଫେରନ୍ତୁ।",
    crossed: "ଭାରତୀୟ ଜଳସୀମା ଅତିକ୍ରମ କରିଛନ୍ତି। ତୁରନ୍ତ ଫେରନ୍ତୁ।",
    stale: "ପାଣିପାଗ ସୂଚନା ପୁରୁଣା। ସନ୍ଦେହ ଥିଲେ ଫେରନ୍ତୁ।",
    noGps: "GPS ଉପଲବ୍ଧ ନୁହେଁ। VHF ଚ୍ୟାନେଲ 16 ବ୍ୟବହାର କରନ୍ତୁ, ନେଟ୍ ଆସିଲେ 1554 କଲ୍ କରନ୍ତୁ।",
    bannerNear: "ସୀମା ନିକଟରେ",
    bannerCrossed: "ସୀମା ଅତିକ୍ରମ",
    bannerStale: "ପୁରୁଣା ଫୋରକାଷ୍ଟ",
    bannerNoGps: "GPS ନାହିଁ",
    monitorTitle: "ନିରୀକ୍ଷଣ",
    monitorMessage: "ଅଫଲାଇନ ସୁରକ୍ଷା ନିରୀକ୍ଷଣ ସକ୍ରିୟ ଅଛି।",
    network: "ନେଟୱର୍କ",
    online: "ଅନଲାଇନ",
    offline: "ଅଫଲାଇନ",
    gps: "GPS",
    active: "ସକ୍ରିୟ",
    waiting: "ଅପେକ୍ଷାରତ",
    queuedSos: "କ୍ୟୁ SOS",
    forecast: "ଫୋରକାଷ୍ଟ",
    cached: "କ୍ୟାଶ୍ ହୋଇଛି",
    unavailable: "ଉପଲବ୍ଧ ନାହିଁ",
    returnToShore: "କୂଳକୁ ଫେରିବା ପଥ",
    direction: "ଦିଗ",
    distance: "ଦୂରତା",
    unavailableDirection: "ଉପଲବ୍ଧ ନୁହେଁ",
  },
};

const toKmXY = (lat, lng, refLat) => {
  const x = lng * 111.32 * Math.cos((refLat * Math.PI) / 180);
  const y = lat * 110.57;
  return { x, y };
};

const distancePointToSegmentKm = (point, a, b, refLat) => {
  const p = toKmXY(point[0], point[1], refLat);
  const p1 = toKmXY(a[0], a[1], refLat);
  const p2 = toKmXY(b[0], b[1], refLat);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - p1.x, p.y - p1.y);
  }

  const t = Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dx * dx + dy * dy)));
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
};

const minDistanceToPolygonKm = (point, polygon) => {
  if (!Array.isArray(polygon) || polygon.length < 2) return Number.POSITIVE_INFINITY;
  const refLat = point[0];
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    min = Math.min(min, distancePointToSegmentKm(point, current, next, refLat));
  }
  return min;
};

const pointInPolygon = (point, polygon) => {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];

    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

const toRad = (value) => (value * Math.PI) / 180;
const toDeg = (value) => (value * 180) / Math.PI;

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const bearingDegrees = (lat1, lon1, lat2, lon2) => {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const bearingToCardinal = (bearing) => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(bearing / 45) % 8];
};

const bearingToArrow = (bearing) => {
  const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  return arrows[Math.round(bearing / 45) % 8];
};

const speakWarning = (text, language) => {
  if (!text) return;
  speak(text, language, { rate: 0.92, pitch: 1 });
};

const sendBrowserNotification = (title, body) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
};

export default function OfflineSafetyGuard({ advisoryFetchedAt }) {
  const { profile } = useAuth();
  const [status, setStatus] = useState(null);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [gpsReady, setGpsReady] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [currentGps, setCurrentGps] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [tripState, setTripState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(TRIP_STATE_KEY) || "null");
    } catch (_error) {
      return null;
    }
  });
  const throttleRef = useRef({ key: "", at: 0 });
  const lastGpsRef = useRef(null);
  const staleAlertSentRef = useRef(false);

  const language = profile?.language || "en";
  const uiText = langText[language] || langText.en;
  const ui = {
    tripMode: "Trip mode",
    startTrip: "Start trip",
    endTrip: "End trip",
    tripActive: "Active",
    tripIdle: "Not started",
    safeUntil: "Safe until",
    remaining: "Remaining",
    minShort: "min",
    returnNow: "Return to shore now",
    emergencyProtocol: "Emergency protocol",
    protocol1: "Follow direction arrow and reduce speed.",
    protocol2: "Call 1554 when network is available.",
    protocol3: "Use VHF Channel 16 if no mobile signal.",
    call1554: "Call 1554",
    vhfHint: "VHF Ch-16",
    ...uiText,
  };

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      if (!tripState) {
        localStorage.removeItem(TRIP_STATE_KEY);
      } else {
        localStorage.setItem(TRIP_STATE_KEY, JSON.stringify(tripState));
      }
    } catch (_error) {
      // Ignore storage errors.
    }
  }, [tripState]);

  useEffect(() => {
    const refresh = () => {
      try {
        const queue = JSON.parse(localStorage.getItem("offline_sos_queue_v1") || "[]");
        setQueueCount(Array.isArray(queue) ? queue.length : 0);
      } catch (_error) {
        setQueueCount(0);
      }
    };

    refresh();
    const id = window.setInterval(refresh, 3000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const activeZonePolygon = useMemo(() => {
    try {
      const raw = localStorage.getItem(ZONES_CACHE_KEY);
      const zones = raw ? JSON.parse(raw) : [];
      const zone = zones.find((item) => item.id === profile?.primaryZoneId);
      return Array.isArray(zone?.polygon) && zone.polygon.length >= 3 ? zone.polygon : null;
    } catch (_error) {
      return null;
    }
  }, [profile?.primaryZoneId]);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // Ignore notification permission failures.
      });
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus({ level: "gps", message: uiText.noGps, title: uiText.bannerNoGps });
      return () => {};
    }

    const announce = (key, message, level, title, meta = {}) => {
      const now = Date.now();
      if (throttleRef.current.key === key && now - throttleRef.current.at < 60000) return;
      throttleRef.current = { key, at: now };
      if (navigator.vibrate) {
        navigator.vibrate(level === "crossed" ? [400, 120, 400, 120, 400] : [220, 80, 220]);
      }
      speakWarning(message, language);
      sendBrowserNotification(title, message);
      pushSafetyEvent({
        type: key,
        level: level === "crossed" ? "DANGER" : level === "near" || level === "stale" ? "ADVISORY" : "INFO",
        source: "OFFLINE_GPS",
        message,
        meta,
      });
      setStatus({ level, message, title });
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsReady(true);
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);
        setCurrentGps({ lat, lng });
        lastGpsRef.current = { lat, lng };
        const point = [lat, lng];
        const insideIndian = pointInPolygon(point, INDIAN_WATERS_POLYGON);

        if (!insideIndian) {
          announce("crossed", uiText.crossed, "crossed", uiText.bannerCrossed, { lat, lng, trigger: "outside_indian_polygon" });
          return;
        }

        const polygon = activeZonePolygon || INDIAN_WATERS_POLYGON;
        const distanceKm = minDistanceToPolygonKm(point, polygon);
        if (distanceKm <= 5) {
          announce("near", uiText.near, "near", uiText.bannerNear, { lat, lng, distanceKm: Number(distanceKm.toFixed(2)), thresholdKm: 5 });
          return;
        }

        setStatus((current) => (current?.level === "stale" ? current : null));
      },
      () => {
        setGpsReady(false);
        announce("gps", uiText.noGps, "gps", uiText.bannerNoGps, { trigger: "gps_error" });
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeZonePolygon, language, uiText.bannerCrossed, uiText.bannerNear, uiText.bannerNoGps, uiText.crossed, uiText.near, uiText.noGps]);

  useEffect(() => {
    if (!advisoryFetchedAt) return;
    const fetchedAtMs = new Date(advisoryFetchedAt).getTime();
    if (Number.isNaN(fetchedAtMs)) return;

    const ageMin = (nowTick - fetchedAtMs) / 60000;
    if (ageMin > 60) {
      setStatus((current) => {
        if (current?.level === "crossed" || current?.level === "near" || current?.level === "gps") {
          return current;
        }
        return { level: "stale", message: ui.stale, title: ui.bannerStale };
      });
      if (!staleAlertSentRef.current) {
        pushSafetyEvent({
          type: "stale_forecast",
          level: ageMin > 180 ? "DANGER" : "ADVISORY",
          source: "FORECAST_FRESHNESS",
          message: ui.stale,
          meta: {
            advisoryFetchedAt,
            ageMinutes: Number(ageMin.toFixed(1)),
            lastGps: lastGpsRef.current,
          },
        });
        staleAlertSentRef.current = true;
      }
      if (ageMin > 180) {
        speakWarning(ui.stale, language);
        sendBrowserNotification(ui.bannerStale, ui.stale);
      }
    } else {
      staleAlertSentRef.current = false;
    }
  }, [advisoryFetchedAt, language, nowTick, ui.bannerStale, ui.stale]);

  useEffect(() => {
    if (!tripState?.safeUntil) return;
    const safeUntilMs = new Date(tripState.safeUntil).getTime();
    if (Number.isNaN(safeUntilMs)) return;
    if (nowTick <= safeUntilMs) return;

    setStatus((current) => {
      if (current?.level === "crossed") return current;
      return { level: "stale", title: ui.bannerStale, message: ui.stale };
    });
  }, [nowTick, tripState?.safeUntil, ui.bannerStale, ui.stale]);

  const homeLat = Number(profile?.latitude);
  const homeLng = Number(profile?.longitude);
  const hasHome = Number.isFinite(homeLat) && Number.isFinite(homeLng);
  const hasCurrent = Number.isFinite(currentGps?.lat) && Number.isFinite(currentGps?.lng);

  const shoreDistanceKm = hasHome && hasCurrent ? haversineKm(currentGps.lat, currentGps.lng, homeLat, homeLng) : null;
  const shoreBearing = hasHome && hasCurrent ? bearingDegrees(currentGps.lat, currentGps.lng, homeLat, homeLng) : null;
  const shoreCardinal = Number.isFinite(shoreBearing) ? bearingToCardinal(shoreBearing) : null;
  const shoreArrow = Number.isFinite(shoreBearing) ? bearingToArrow(shoreBearing) : null;

  const safeUntilText = tripState?.safeUntil
    ? new Date(tripState.safeUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "-";
  const remainingMin = tripState?.safeUntil
    ? Math.max(0, Math.floor((new Date(tripState.safeUntil).getTime() - nowTick) / 60000))
    : null;

  const startTrip = () => {
    const baseMs = advisoryFetchedAt ? new Date(advisoryFetchedAt).getTime() : Date.now();
    const safeUntil = new Date(baseMs + 6 * 60 * 60000).toISOString();
    setTripState({ startedAt: new Date().toISOString(), safeUntil });
  };

  const endTrip = () => {
    setTripState(null);
  };

  const showStatus = status || { level: "ok", title: uiText.monitorTitle, message: uiText.monitorMessage };

  const toneClass =
    showStatus.level === "crossed"
      ? "border-red-700 bg-red-700 text-white"
      : showStatus.level === "near"
        ? "border-amber-500 bg-amber-500 text-black"
        : showStatus.level === "stale"
          ? "border-amber-600 bg-amber-600 text-black"
          : "border-emerald-700 bg-emerald-700 text-white";

  const criticalMode = showStatus.level === "crossed" || showStatus.level === "stale";

  useEffect(() => {
    if (!criticalMode) return () => {};
    const id = window.setInterval(() => {
      speakWarning(showStatus.message, language);
    }, 90000);
    return () => window.clearInterval(id);
  }, [criticalMode, language, showStatus.message]);

  return (
    <div className={`mx-4 mt-2 rounded-2xl border px-4 py-3 shadow-lg md:mx-6 ${toneClass}`} role="alert" aria-live="assertive">
      <p className="text-xs font-black uppercase tracking-[0.2em]">{showStatus.title}</p>
      <p className="mt-1 text-sm font-bold">{showStatus.message}</p>
      <div className="mt-2 grid gap-2 text-xs font-bold md:grid-cols-4">
        <span className="rounded-full bg-black/20 px-3 py-1">{ui.network}: {online ? ui.online : ui.offline}</span>
        <span className="rounded-full bg-black/20 px-3 py-1">{ui.gps}: {gpsReady ? ui.active : ui.waiting}</span>
        <span className="rounded-full bg-black/20 px-3 py-1">{ui.queuedSos}: {queueCount}</span>
        <span className="rounded-full bg-black/20 px-3 py-1">{ui.forecast}: {advisoryFetchedAt ? ui.cached : ui.unavailable}</span>
      </div>
      <div className="mt-2 rounded-xl bg-black/20 px-3 py-2 text-xs font-black">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>{ui.tripMode}: {tripState ? ui.tripActive : ui.tripIdle}</span>
          {tripState ? (
            <button type="button" onClick={endTrip} className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide">
              {ui.endTrip}
            </button>
          ) : (
            <button type="button" onClick={startTrip} className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide">
              {ui.startTrip}
            </button>
          )}
        </div>
        {tripState ? (
          <div className="mt-1 text-[11px] font-bold">
            {ui.safeUntil}: {safeUntilText} | {ui.remaining}: {remainingMin} {ui.minShort}
          </div>
        ) : null}
      </div>
      <div className="mt-2 rounded-xl bg-black/20 px-3 py-2 text-xs font-black">
        <span>{ui.returnToShore}: </span>
        {Number.isFinite(shoreBearing) && Number.isFinite(shoreDistanceKm) ? (
          <>
            <span>{ui.direction} {shoreArrow} {shoreCardinal} ({Math.round(shoreBearing)}°), </span>
            <span>{ui.distance} {shoreDistanceKm.toFixed(1)} km</span>
          </>
        ) : (
          <span>{ui.unavailableDirection}</span>
        )}
      </div>
      {criticalMode ? (
        <div className="mt-2 rounded-xl border border-white/30 bg-black/25 px-3 py-3 text-xs font-black animate-pulse">
          <p className="uppercase tracking-[0.14em]">{ui.returnNow}</p>
          <p className="mt-1 uppercase tracking-[0.14em]">{ui.emergencyProtocol}</p>
          <ul className="mt-2 space-y-1 text-[12px] font-bold">
            <li>1. {ui.protocol1}</li>
            <li>2. {ui.protocol2}</li>
            <li>3. {ui.protocol3}</li>
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href="tel:1554" className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide">
              {ui.call1554}
            </a>
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide">{ui.vhfHint}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
