import { fetchJson, buildQueryString } from './client';
import type { MarineForecast, WeatherForecast, CurrentConditions } from './types';

const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getMarineData(lat: number, lon: number): Promise<MarineForecast | null> {
  const params = {
    latitude: lat,
    longitude: lon,
    hourly: 'wave_height,wave_direction,wave_period,swell_wave_height,wind_wave_height',
    timezone: 'auto',
    forecast_days: 7,
  };

  const url = `${MARINE_API_URL}?${buildQueryString(params)}`;
  const result = await fetchJson<MarineForecast>(url, {}, { timeout: 15000 });

  return result.data;
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherForecast | null> {
  const params = {
    latitude: lat,
    longitude: lon,
    hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,precipitation,weather_code',
    current: 'temperature_2m,wind_speed_10m,wind_direction_10m,weather_code',
    timezone: 'auto',
    forecast_days: 7,
  };

  const url = `${WEATHER_API_URL}?${buildQueryString(params)}`;
  const result = await fetchJson<WeatherForecast>(url, {}, { timeout: 15000 });

  return result.data;
}

export function extractCurrentConditions(
  marine: MarineForecast | null,
  weather: WeatherForecast | null
): CurrentConditions | null {
  if (!marine?.hourly || !weather?.hourly) {
    return null;
  }

  const now = new Date();
  const currentHour = now.getHours();
  
  const getClosestIndex = (times: string[]) => {
    let closestIndex = 0;
    let minDiff = Infinity;
    
    times.forEach((time, index) => {
      const timeDate = new Date(time);
      const diff = Math.abs(timeDate.getTime() - now.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  };

  const marineIdx = getClosestIndex(marine.hourly.time);
  const weatherIdx = getClosestIndex(weather.hourly.time);
  const hourly = weather.hourly;

  const windSpeedSeries = hourly.wind_speed_10m ?? hourly.windspeed_10m ?? [];
  const windGustSeries = hourly.wind_gusts_10m ?? hourly.windgusts_10m ?? [];
  const windDirectionSeries = hourly.wind_direction_10m ?? hourly.winddirection_10m ?? [];
  const weatherCodeSeries = hourly.weather_code ?? hourly.weathercode ?? [];

  const weatherDescriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };

  return {
    wave_height_m: Math.round((marine.hourly.wave_height[marineIdx] || 0) * 10) / 10,
    wave_direction_deg: marine.hourly.wave_direction[marineIdx] || 0,
    swell_height_m: Math.round((marine.hourly.swell_wave_height[marineIdx] || 0) * 10) / 10,
    wind_speed_kmh: Math.round(windSpeedSeries[weatherIdx] || 0),
    wind_gust_kmh: Math.round(windGustSeries[weatherIdx] || 0),
    wind_direction_deg: windDirectionSeries[weatherIdx] || 0,
    visibility_km: Math.round((weather.hourly.visibility[weatherIdx] || 10000) / 1000 * 10) / 10,
    weather_code: weatherCodeSeries[weatherIdx] || 0,
    weather_description: weatherDescriptions[weatherCodeSeries[weatherIdx]] || 'Unknown',
  };
}

export function extractHourlyForecasts(
  marine: MarineForecast | null,
  weather: WeatherForecast | null
): { time: string; wave_height: number; wind_speed: number; wind_gust: number }[] {
  if (!marine?.hourly || !weather?.hourly) {
    return [];
  }

  const forecasts: { time: string; wave_height: number; wind_speed: number; wind_gust: number }[] = [];
  const windSpeedSeries = weather.hourly.wind_speed_10m ?? weather.hourly.windspeed_10m ?? [];
  const windGustSeries = weather.hourly.wind_gusts_10m ?? weather.hourly.windgusts_10m ?? [];
  
  const minLen = Math.min(marine.hourly.time.length, weather.hourly.time.length);
  
  for (let i = 0; i < Math.min(minLen, 48); i++) {
    forecasts.push({
      time: marine.hourly.time[i],
      wave_height: Math.round((marine.hourly.wave_height[i] || 0) * 10) / 10,
      wind_speed: Math.round(windSpeedSeries[i] || 0),
      wind_gust: Math.round(windGustSeries[i] || 0),
    });
  }

  return forecasts;
}

export function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function getWaveCondition(heightM: number): string {
  if (heightM < 0.5) return 'Calm';
  if (heightM < 1.0) return 'Light';
  if (heightM < 1.5) return 'Moderate';
  if (heightM < 2.5) return 'Rough';
  return 'Very Rough';
}