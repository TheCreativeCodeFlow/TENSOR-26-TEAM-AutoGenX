import { nowIso } from "../shared/time.js";

const normalize = (value, min, max) => Math.max(min, Math.min(max, value));

const pseudoNoise = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const toHour = (date = new Date()) => date.getUTCHours();

export const syntheticMarineProvider = {
  generateCurrent(zone) {
    const seed = zone.center.lat * 100 + zone.center.lng * 10 + toHour();
    const n1 = pseudoNoise(seed);
    const n2 = pseudoNoise(seed + 10);
    const n3 = pseudoNoise(seed + 20);

    return {
      zoneId: zone.id,
      observedAt: nowIso(),
      windSpeedKmph: normalize(12 + n1 * 38, 8, 55),
      waveHeightM: normalize(0.4 + n2 * 3.2, 0.3, 4),
      visibilityKm: normalize(3 + n3 * 9, 2, 12),
      stormIndex: normalize(20 + (n1 + n2) * 45, 0, 100)
    };
  },
  generateForecast(zone, hours) {
    const forecast = [];
    for (let i = 1; i <= hours; i += 1) {
      const t = new Date();
      t.setHours(t.getHours() + i);
      const seed = zone.center.lat * 100 + zone.center.lng * 10 + toHour(t) + i;
      const n = pseudoNoise(seed);
      forecast.push({
        hourOffset: i,
        at: t.toISOString(),
        windSpeedKmph: normalize(10 + n * 42, 8, 58),
        waveHeightM: normalize(0.3 + n * 3.8, 0.2, 4.5),
        visibilityKm: normalize(2.5 + (1 - n) * 10, 2, 12),
        stormIndex: normalize(15 + n * 70, 0, 100)
      });
    }
    return forecast;
  }
};
