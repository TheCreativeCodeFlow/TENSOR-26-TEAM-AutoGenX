// Marine Weather API Service
// Fetches real-time data from Open-Meteo Marine API and other sources

import { FishingZone, fishingZones } from '../data/zones';

const OPEN_METEO_MARINE = 'https://marine-api.open-meteo.com/v1/marine';
const OPEN_METEO_WEATHER = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 7000;

const MARINE_HOURLY_FIELDS =
  'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction';
const WEATHER_CURRENT_FIELDS =
  'wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,visibility';
const WEATHER_HOURLY_FIELDS = 'wind_speed_10m,wind_gusts_10m,visibility,weather_code';

function getHourlyValue(hourly: Record<string, unknown>, keys: string[], index: number): number {
  for (const key of keys) {
    const series = (hourly as Record<string, unknown>)[key];
    if (Array.isArray(series)) {
      const value = Number(series[index]);
      if (Number.isFinite(value)) {
        return value;
      }
    }
  }
  return 0;
}

function getCurrentValue(current: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = Number((current as Record<string, unknown>)[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface MarineWeatherData {
  wave_height: number;
  wave_direction: number;
  wave_period: number;
  swell_height: number;
  swell_direction: number;
  wind_speed: number;
  wind_direction: number;
  wind_gust: number;
  visibility: number;
  weather_code: number;
}

export interface MarineForecast {
  hourly: Array<{
    time: string;
    wave_height: number;
    wave_direction: number;
    swell_height: number;
    wind_speed: number;
    wind_gust: number;
  }>;
}

// Fetch marineweather for a zone
export const fetchMarineWeather = async (zone: FishingZone): Promise<MarineWeatherData> => {
  const { centroid_lat, centroid_lon, id } = zone;
  console.log('[API] Fetching', id);
  
  try {
    // Marine data - use hourly first to get the latest hour
    const marineUrl = `${OPEN_METEO_MARINE}?latitude=${centroid_lat}&longitude=${centroid_lon}&hourly=${MARINE_HOURLY_FIELDS}&timezone=auto`;
    const marineJson = await fetchJsonWithTimeout<{ hourly?: Record<string, unknown> }>(marineUrl);
    
    // Weather data
    const weatherUrl = `${OPEN_METEO_WEATHER}?latitude=${centroid_lat}&longitude=${centroid_lon}&current=${WEATHER_CURRENT_FIELDS}&hourly=${WEATHER_HOURLY_FIELDS}&timezone=auto`;
    const weatherJson = await fetchJsonWithTimeout<{ current?: Record<string, unknown> }>(weatherUrl);
    
    // Get latest hourly wave data
    const hourly = marineJson.hourly || {};
    const hourlyTime = Array.isArray((hourly as { time?: unknown[] }).time)
      ? ((hourly as { time?: unknown[] }).time as unknown[])
      : [];
    const latestIdx = (hourlyTime.length || 1) - 1;
    const waveHeight = Array.isArray((hourly as { wave_height?: unknown[] }).wave_height)
      ? Number((hourly as { wave_height?: unknown[] }).wave_height?.[latestIdx]) || 0
      : 0;
    const waveDirection = Array.isArray((hourly as { wave_direction?: unknown[] }).wave_direction)
      ? Number((hourly as { wave_direction?: unknown[] }).wave_direction?.[latestIdx]) || 0
      : 0;
    const wavePeriod = Array.isArray((hourly as { wave_period?: unknown[] }).wave_period)
      ? Number((hourly as { wave_period?: unknown[] }).wave_period?.[latestIdx]) || 0
      : 0;
    const swellHeight = getHourlyValue(hourly, ['swell_wave_height', 'swell_height'], latestIdx);
    const swellDirection = getHourlyValue(
      hourly,
      ['swell_wave_direction', 'swell_direction'],
      latestIdx
    );
    
    const weatherCurrent = weatherJson.current || {};
    const windSpeed = getCurrentValue(weatherCurrent, ['wind_speed_10m', 'windspeed_10m']);
    const windDirection = getCurrentValue(weatherCurrent, ['wind_direction_10m', 'winddirection_10m']);
    const windGust = getCurrentValue(weatherCurrent, ['wind_gusts_10m', 'windgusts_10m']);
    const weatherCode = getCurrentValue(weatherCurrent, ['weather_code', 'weathercode']);
    
    console.log('[API] Got', id, '- wave:', waveHeight.toFixed(1), 'm, wind:', windSpeed.toFixed(0), 'km/h');
    
    return {
      wave_height: waveHeight || 0,
      wave_direction: waveDirection || 0,
      wave_period: wavePeriod || 0,
      swell_height: swellHeight || 0,
      swell_direction: swellDirection || 0,
      wind_speed: windSpeed || 0,
      wind_direction: windDirection || 0,
      wind_gust: windGust || 0,
      visibility: Number((weatherCurrent as { visibility?: unknown }).visibility) || 10000,
      weather_code: weatherCode || 0,
    };
  } catch (error) {
    console.error('[API] Error for', id, ':', error);
    return getDefaultWeather();
  }
};

// Fetch 48-hour forecast
export const fetchMarineForecast = async (zone: FishingZone): Promise<MarineForecast> => {
  const { centroid_lat, centroid_lon } = zone;
  
  try {
    const marineUrl = `${OPEN_METEO_MARINE}?latitude=${centroid_lat}&longitude=${centroid_lon}&hourly=wave_height,wave_direction,swell_wave_height,swell_wave_direction&forecast_days=2&timezone=auto`;
    const weatherUrl = `${OPEN_METEO_WEATHER}?latitude=${centroid_lat}&longitude=${centroid_lon}&hourly=wind_speed_10m,wind_gusts_10m,visibility&forecast_days=2&timezone=auto`;

    const [marineJson, weatherJson] = await Promise.all([
      fetchJsonWithTimeout<{ hourly?: Record<string, unknown> }>(marineUrl),
      fetchJsonWithTimeout<{ hourly?: Record<string, unknown> }>(weatherUrl),
    ]);
    
    const marineHourly = marineJson.hourly || {};
    const weatherHourly = weatherJson.hourly || {};
    const marineTimes = Array.isArray((marineHourly as { time?: unknown[] }).time)
      ? ((marineHourly as { time?: unknown[] }).time as string[])
      : [];

    const hourly = marineTimes.map((time: string, i: number) => ({
      time,
      wave_height: Number((marineHourly as { wave_height?: unknown[] }).wave_height?.[i]) || 0,
      wave_direction: Number((marineHourly as { wave_direction?: unknown[] }).wave_direction?.[i]) || 0,
      swell_height: getHourlyValue(marineHourly, ['swell_wave_height', 'swell_height'], i),
      wind_speed: getHourlyValue(weatherHourly, ['wind_speed_10m', 'windspeed_10m'], i),
      wind_gust: getHourlyValue(weatherHourly, ['wind_gusts_10m', 'windgusts_10m'], i),
    }));
    
    return { hourly };
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return { hourly: [] };
  }
};

// Fetch all zones weather for heatmap
export const fetchAllZonesWeather = async (): Promise<Map<string, MarineWeatherData>> => {
  console.log('[API] Fetching weather for', fishingZones.length, 'zones...');
  const weatherMap = new Map<string, MarineWeatherData>();
  
  const promises = fishingZones.map(async (zone) => {
    const weather = await fetchMarineWeather(zone);
    weatherMap.set(zone.id, weather);
  });
  
  await Promise.all(promises);
  console.log('[API] Loaded', weatherMap.size, 'zones');
  return weatherMap;
};

// Get color based on wave height for heatmap
export const getWaveColor = (height: number): string => {
  if (height < 0.5) return 'rgba(45, 106, 79, 0.6)';  // Safe - green
  if (height < 1.0) return 'rgba(118, 168, 132, 0.6)';  // Mostly safe
  if (height < 1.5) return 'rgba(247, 127, 0, 0.6)';    // Advisory - amber
  if (height < 2.5) return 'rgba(214, 40, 40, 0.6)';       // Danger - red
  return 'rgba(123, 45, 139, 0.7)';                     // Extreme - purple
};

// Get color based on wind speed for heatmap
export const getWindColor = (speed: number): string => {
  if (speed < 20) return 'rgba(45, 106, 79, 0.6)';
  if (speed < 35) return 'rgba(247, 127, 0, 0.6)';
  if (speed < 50) return 'rgba(214, 40, 40, 0.6)';
  return 'rgba(123, 45, 139, 0.7)';
};

// Calculate overall risk level (0-100) based on conditions
export const calculateRiskScore = (
  weather: MarineWeatherData,
  boatClass: 'A' | 'B' | 'C'
): number => {
  const limits = {
    A: { wave: 1.0, wind: 28, gust: 35, visibility: 3 },
    B: { wave: 2.0, wind: 40, gust: 50, visibility: 2 },
    C: { wave: 3.5, wind: 55, gust: 65, visibility: 1 },
  }[boatClass];
  
  let score = 0;
  
  // Wave score (35%)
  const waveRatio = weather.wave_height / limits.wave;
  if (waveRatio <= 0.5) score += waveRatio * 40 * 0.35;
  else if (waveRatio <= 0.75) score += (20 + (waveRatio - 0.5) / 0.25 * 30) * 0.35;
  else if (waveRatio <= 1.0) score += (50 + (waveRatio - 0.75) / 0.25 * 30) * 0.35;
  else score += Math.min(80 + (waveRatio - 1.0) * 50, 100) * 0.35;
  
  // Wind score (30%)
  const windRatio = Math.max(weather.wind_speed, weather.wind_gust * 0.8) / limits.wind;
  if (windRatio <= 0.5) score += windRatio * 40 * 0.3;
  else if (windRatio <= 0.75) score += (20 + (windRatio - 0.5) / 0.25 * 30) * 0.3;
  else if (windRatio <= 1.0) score += (50 + (windRatio - 0.75) / 0.25 * 30) * 0.3;
  else score += Math.min(80 + (windRatio - 1.0) * 50, 100) * 0.3;
  
  // Visibility score (15%)
  const visRatio = weather.visibility / 1000 / limits.visibility;
  if (visRatio >= 2) score += 0;
  else if (visRatio >= 1) score += 30 * 0.15;
  else if (visRatio >= 0.5) score += 65 * 0.15;
  else score += 90 * 0.15;
  
  // Swell (20%)
  const swellRatio = weather.swell_height / (limits.wave * 0.8);
  if (swellRatio <= 0.5) score += swellRatio * 40 * 0.2;
  else score += 50 * 0.2;
  
  return Math.min(Math.round(score), 100);
};

const getDefaultWeather = (): MarineWeatherData => ({
  wave_height: 0,
  wave_direction: 0,
  wave_period: 0,
  swell_height: 0,
  swell_direction: 0,
  wind_speed: 0,
  wind_direction: 0,
  wind_gust: 0,
  visibility: 10000,
  weather_code: 0,
});