import { zonesRepository } from "../zones/zones.repository.js";
import { marineWeatherService } from "../marine-weather/marine-weather.service.js";
import { createNotFoundError } from "../shared/errors.js";
import { liveDataProvider } from "../shared/live-data.provider.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const latestEvaluations = [];

const computeLevel = (score, stormIndex) => {
  if (stormIndex >= 80 || score >= 85) return "CYCLONE_WARNING";
  if (score >= 65) return "DANGER";
  if (score >= 40) return "ADVISORY";
  return "SAFE";
};

const toGoNoGo = (level) => {
  if (level === "SAFE") return "GO";
  if (level === "ADVISORY") return "CAUTION";
  if (level === "CYCLONE_WARNING") return "STAY_IN_PORT";
  return "NO_GO";
};

const safeReturnHours = (level) => {
  if (level === "SAFE") return "8-10h";
  if (level === "ADVISORY") return "3-4h";
  if (level === "DANGER") return "1-2h";
  return "Immediate return";
};

const localizedMessages = {
  SAFE: {
    en: "Sea is stable for departure. Continue routine caution checks.",
    ta: "Kadal nilai sthiramaaga ulladhu. Saadharana echarikkaiyudan purappadalam.",
    ml: "Samudra avastha sthiraman. Sadharana jagrathayode purappedaam.",
    te: "Samudra paristhitulu sthiranga unnayi. Sadharana jagratato vellavachu.",
    or: "Samudra abastha sthira achhi. Sadharana satarkata saha jiba uchit.",
  },
  ADVISORY: {
    en: "Proceed with caution and stay close to the coast.",
    ta: "Echarikkaiyudan sellavum, karai pakkaththil irukkavum.",
    ml: "Jagrathayode pokuka, karayodu aduthu nilkkuka.",
    te: "Jagrataga vellandi, teeranki daggara undandi.",
    or: "Satarkata saha jantu ebam tira nikatare rahantu.",
  },
  DANGER: {
    en: "No-go. High wind and wave conditions raise accident risk.",
    ta: "Poga vendam. Kaatru matrum alai adhigam, apayam perugiradhu.",
    ml: "Pokaruthu. Kaattu tharangam uyarunnu, apakadam koodunnu.",
    te: "Vellakudadhu. Gali mariyu alalu ekkuva, pramadam perigindi.",
    or: "Jiba uchit nuhen. Bada bataas ebam taranga jhuki badhae.",
  },
  CYCLONE_WARNING: {
    en: "Stay in port. Cyclone-linked conditions make departure unsafe.",
    ta: "Thuraimugaththil thangavum. Cyclone nilai purappadarku paadhukaappalla.",
    ml: "Thurannil thanne nilkkuka. Cyclone karanam purappadu surakshithamalla.",
    te: "Port lo undandi. Cyclone paristhitulu prayaananiki surakshitam kaavu.",
    or: "Bandare rahantu. Cyclone abasthare bahariba asurakshita.",
  },
};

const overlayColor = {
  SAFE: "#0F7B3B",
  ADVISORY: "#A06A00",
  DANGER: "#C53030",
  CYCLONE_WARNING: "#7F1D1D",
};

const buildSafeReturnWindow = (forecast, zone) => {
  const safeSlot = forecast.find(
    (slot) =>
      slot.windSpeedKmph <= zone.maxSafeWindKmph &&
      slot.waveHeightM <= zone.maxSafeWaveHeightM &&
      slot.stormIndex < 55,
  );

  if (!safeSlot) {
    return {
      available: false,
      startAt: null,
      note: "No safe return window found in the current forecast horizon.",
    };
  }

  return {
    available: true,
    startAt: safeSlot.at,
    note: "Earliest forecast slot that falls within configured safe wind and wave thresholds.",
  };
};

export const advisoriesService = {
  async evaluate(zoneId, conditions) {
    const zone = await zonesRepository.findById(zoneId);
    if (!zone) throw createNotFoundError("Zone", zoneId);

    const windRisk = clamp((conditions.windSpeedKmph / Math.max(zone.maxSafeWindKmph, 1)) * 100, 0, 100);
    const waveRisk = clamp((conditions.waveHeightM / Math.max(zone.maxSafeWaveHeightM, 0.1)) * 100, 0, 100);
    const visibilityRisk = clamp(100 - conditions.visibilityKm * 8, 0, 100);
    const stormRisk = clamp(conditions.stormIndex, 0, 100);
    const incidentRisk = 0;

    const score = clamp(
      0.34 * windRisk + 0.34 * waveRisk + 0.16 * visibilityRisk + 0.16 * stormRisk,
      0,
      100
    );
    const level = computeLevel(score, stormRisk);
    const goNoGo = toGoNoGo(level);
    const forecast = (await marineWeatherService.getForecast(zoneId, 12)).forecast;
    const imdAlerts = await liveDataProvider.getImdCapAlerts();
    const latestAlerts = imdAlerts.slice(0, 3).map((alert) => ({
      id: alert.id,
      zoneId,
      severity: level === "SAFE" ? "info" : level === "ADVISORY" ? "medium" : "critical",
      level,
      title: alert.title,
      link: alert.link,
      createdAt: alert.publishedAt,
    }));
    const advisory = {
      zoneId,
      zoneName: zone.name,
      riskScore: Math.round(score),
      riskLevel: level,
      recommendation: goNoGo,
      safeReturnWindow: safeReturnHours(level),
      safeReturnWindowEstimate: buildSafeReturnWindow(forecast, zone),
      localizedMessage: localizedMessages[level],
      dangerZoneOverlay: {
        zoneId,
        color: overlayColor[level],
        polygon: zone.polygon,
      },
      activeAlerts: latestAlerts,
      metrics: {
        windSpeedKmph: Number(conditions.windSpeedKmph.toFixed(1)),
        waveHeightM: Number(conditions.waveHeightM.toFixed(2)),
        visibilityKm: Number(conditions.visibilityKm.toFixed(1)),
        stormIndex: Math.round(stormRisk),
        incidentRisk: Math.round(incidentRisk),
      }
    };

    latestEvaluations.unshift(advisory);
    if (latestEvaluations.length > 120) latestEvaluations.pop();
    return { advisory };
  },
  async evaluateLive(zoneId) {
    const { conditions } = await marineWeatherService.getCurrent(zoneId);
    return this.evaluate(zoneId, conditions);
  },
  listHistory(zoneId) {
    return { advisories: latestEvaluations.filter((item) => item.zoneId === zoneId) };
  }
};
