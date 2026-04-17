import { zonesRepository } from "../zones/zones.repository.js";
import { createNotFoundError, createValidationError } from "../shared/errors.js";
import { env } from "../../config/env.js";
import { liveDataProvider } from "../shared/live-data.provider.js";

const toStormIndex = (weatherId, windSpeedKmph, visibilityKm) => {
  const severeCode = weatherId >= 200 && weatherId < 800 ? 75 : 20;
  const windRisk = Math.min(100, Math.round((windSpeedKmph / 55) * 100));
  const visibilityRisk = Math.min(100, Math.max(0, 100 - visibilityKm * 10));
  return Math.round(0.5 * severeCode + 0.3 * windRisk + 0.2 * visibilityRisk);
};

const resolveZoneCoordinates = (zone) => {
  const lat = zone?.center?.lat;
  const lng = zone?.center?.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw createValidationError("Selected zone has no valid coordinates for live provider lookup");
  }
  return { lat, lng };
};

export const marineWeatherService = {
  async getCurrent(zoneId) {
    const zone = await zonesRepository.findById(zoneId);
    if (!zone) throw createNotFoundError("Zone", zoneId);
    if (env.strictLiveData && !env.openWeatherApiKey) {
      throw createValidationError("OPENWEATHER_API_KEY is required for live marine data.");
    }

    const { lat, lng } = resolveZoneCoordinates(zone);
    const payload = await liveDataProvider.getOpenWeatherCurrent(lat, lng);
    const windSpeedKmph = Number(((payload?.wind?.speed || 0) * 3.6).toFixed(1));
    const waveHeightM = Number((Math.max(0.2, windSpeedKmph / 28)).toFixed(2));
    const visibilityKm = Number(((payload?.visibility || 0) / 1000).toFixed(1));
    const weatherId = Number(payload?.weather?.[0]?.id || 800);
    const generated = {
      at: payload?.dt ? new Date(payload.dt * 1000).toISOString() : new Date().toISOString(),
      windSpeedKmph,
      waveHeightM,
      visibilityKm,
      stormIndex: toStormIndex(weatherId, windSpeedKmph, visibilityKm),
      temperatureC: Number((payload?.main?.temp ?? 0).toFixed(1)),
      weatherMain: payload?.weather?.[0]?.main || "Unknown",
      weatherDescription: payload?.weather?.[0]?.description || "",
    };

    return { zone, conditions: generated };
  },
  async getForecast(zoneId, hours) {
    const zone = await zonesRepository.findById(zoneId);
    if (!zone) throw createNotFoundError("Zone", zoneId);
    if (env.strictLiveData && !env.openWeatherApiKey) {
      throw createValidationError("OPENWEATHER_API_KEY is required for live marine forecast.");
    }

    const { lat, lng } = resolveZoneCoordinates(zone);
    const payload = await liveDataProvider.getOpenWeatherForecast(lat, lng);
    const maxSlots = Math.max(1, Math.min(16, Math.ceil(hours / 3)));
    const forecast = (payload?.list || []).slice(0, maxSlots).map((slot) => {
      const windSpeedKmph = Number(((slot?.wind?.speed || 0) * 3.6).toFixed(1));
      const visibilityKm = Number(((slot?.visibility || 0) / 1000).toFixed(1));
      const weatherId = Number(slot?.weather?.[0]?.id || 800);
      return {
        at: slot?.dt_txt ? new Date(slot.dt_txt).toISOString() : new Date(slot?.dt * 1000).toISOString(),
        windSpeedKmph,
        waveHeightM: Number((Math.max(0.2, windSpeedKmph / 28)).toFixed(2)),
        visibilityKm,
        stormIndex: toStormIndex(weatherId, windSpeedKmph, visibilityKm),
      };
    });

    return {
      zone,
      forecast,
    };
  },
  async getTides(zoneId) {
    const zone = await zonesRepository.findById(zoneId);
    if (!zone) throw createNotFoundError("Zone", zoneId);

    const bulletins = await liveDataProvider.getIncoisBulletins();
    return {
      zone,
      tides: [],
      bulletinReferences: bulletins,
      note: "INCOIS public bulletins are linked as live references. Structured tide tables are not emitted by the current free feeds.",
    };
  }
};
