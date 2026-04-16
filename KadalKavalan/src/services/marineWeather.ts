// Marine Weather API Service
// Fetches real-time data from Open-Meteo Marine API and other sources

import { FishingZone, fishingZones } from '../data/zones';

const OPEN_METEO_MARINE = 'https://marine-api.open-meteo.com/v1/marine';
const OPEN_METEO_WEATHER = 'https://api.open-meteo.com/v1/forecast';

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
    const marineUrl = `${OPEN_METEO_MARINE}?latitude=${centroid_lat}&longitude=${centroid_lon}&hourly=wave_height,wave_direction,wave_period,swell_height,swell_direction&timezone=auto`;
    const marineResponse = await fetch(marineUrl);
    const marineJson = await marineResponse.json();
    
    // Weather data
    const weatherUrl = `${OPEN_METEO_WEATHER}?latitude=${centroid_lat}&longitude=${centroid_lon}&current=windspeed_10m,winddirection_10m,windgusts_10m,weathercode,visibility&hourly=windspeed_10m,windgusts_10m,weathercode,visibility&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherJson = await weatherResponse.json();
    
    // Get latest hourly wave data
    const hourly = marineJson.hourly || {};
    const latestIdx = (hourly.time?.length || 1) - 1;
    const waveHeight = hourly.wave_height?.[latestIdx] || 0;
    const waveDirection = hourly.wave_direction?.[latestIdx] || 0;
    const wavePeriod = hourly.wave_period?.[latestIdx] || 0;
    const swellHeight = hourly.swell_height?.[latestIdx] || 0;
    const swellDirection = hourly.swell_direction?.[latestIdx] || 0;
    
    const weatherCurrent = weatherJson.current || {};
    
    console.log('[API] Got', id, '- wave:', waveHeight?.toFixed(1), 'm, wind:', weatherCurrent.windspeed_10m?.toFixed(0), 'km/h');
    
    return {
      wave_height: waveHeight || 0,
      wave_direction: waveDirection || 0,
      wave_period: wavePeriod || 0,
      swell_height: swellHeight || 0,
      swell_direction: swellDirection || 0,
      wind_speed: weatherCurrent.windspeed_10m || 0,
      wind_direction: weatherCurrent.winddirection_10m || 0,
      wind_gust: weatherCurrent.windgusts_10m || 0,
      visibility: weatherCurrent.visibility || 10000,
      weather_code: weatherCurrent.weathercode || 0,
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
    const marineUrl = `${OPEN_METEO_MARINE}?latitude=${centroid_lat}&longitude=${centroid_lon}&hourly=wave_height,wave_direction,swell_height,swell_direction&forecast_days=2&timezone=auto`;
    const weatherUrl = `${OPEN_METEO_WEATHER}?latitude=${centroid_lat}&longitude=${centroid_lon}&hourly=windspeed_10m,windgusts_10m,visibility&forecast_days=2&timezone=auto`;
    
    const [marineRes, weatherRes] = await Promise.all([fetch(marineUrl), fetch(weatherUrl)]);
    const marineJson = await marineRes.json();
    const weatherJson = await weatherRes.json();
    
    const hourly = (marineJson.hourly?.time || []).map((time: string, i: number) => ({
      time,
      wave_height: marineJson.hourly?.wave_height?.[i] || 0,
      wave_direction: marineJson.hourly?.wave_direction?.[i] || 0,
      swell_height: marineJson.hourly?.swell_height?.[i] || 0,
      wind_speed: weatherJson.hourly?.windspeed_10m?.[i] || 0,
      wind_gust: weatherJson.hourly?.windgusts_10m?.[i] || 0,
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