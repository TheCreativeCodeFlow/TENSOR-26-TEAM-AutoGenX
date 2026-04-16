import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { FishingZone } from '../data/zones';
import { BoatClass } from '../data/zones';
import { RiskLevel, RiskAssessment, computeRiskScore } from '../utils/riskEngine';
import { fetchMarineWeather, calculateRiskScore } from '../services/marineWeather';

type ExtraConfig = {
  mlApiUrl?: string;
  mlEnabled?: boolean;
};

const extraConfig = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

const ML_ENABLED =
  (process.env.EXPO_PUBLIC_ML_ENABLED ?? String(extraConfig.mlEnabled ?? true)).toLowerCase() !==
  'false';

let resolvedMLApiUrl: string | null = null;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function getRuntimeHostIp(): string | null {
  const maybeHostUri =
    ((Constants.expoConfig as { hostUri?: string } | null)?.hostUri ?? '') ||
    ((Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost ?? '') ||
    ((Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ?? '');

  if (!maybeHostUri) {
    return null;
  }

  const host = maybeHostUri.split(':')[0]?.trim();
  return host || null;
}

function getMlApiCandidates(): string[] {
  const configuredUrl =
    process.env.EXPO_PUBLIC_ML_API_URL?.trim() || extraConfig.mlApiUrl?.trim() || '';

  const candidates: string[] = [];

  if (configuredUrl) {
    candidates.push(stripTrailingSlash(configuredUrl));
  }

  const runtimeHostIp = getRuntimeHostIp();
  if (runtimeHostIp) {
    candidates.push(`http://${runtimeHostIp}:8000`);
  }

  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:8000');
  }

  candidates.push('http://localhost:8000', 'http://127.0.0.1:8000');

  return Array.from(new Set(candidates.map(stripTrailingSlash)));
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveMLApiUrl(): Promise<string | null> {
  if (!ML_ENABLED) {
    return null;
  }

  if (resolvedMLApiUrl) {
    return resolvedMLApiUrl;
  }

  const candidates = getMlApiCandidates();

  for (const baseUrl of candidates) {
    try {
      const healthRes = await fetchWithTimeout(`${baseUrl}/health`, { method: 'GET' }, 10000);
      if (healthRes.ok) {
        resolvedMLApiUrl = baseUrl;
        console.log('[WeatherContext] ML backend resolved at:', baseUrl);
        return baseUrl;
      }

      console.warn('[WeatherContext] ML health check failed:', baseUrl, 'status', healthRes.status);
    } catch {
      console.warn('[WeatherContext] ML backend unreachable:', baseUrl);
    }
  }

  console.warn('[WeatherContext] No reachable ML backend. Candidates tried:', candidates);
  return null;
}

// Interface for ML predictions
interface MLDaySafety {
  probability_safe: number;
  risk_factors: string[];
  model_used: string;
}

interface MLHourlyRisk {
  risk_score: number;
  hourly_risk: number[];
  safe_window: { start: number; end: number } | null;
  model_used: string;
}

interface MLReturnTime {
  estimated_hours: number;
  confidence: number;
  optimal_departure: number;
  model_used: string;
}

// ML is optional - app works even if ML backend unreachable
const callMLBackend = async (
  zoneId: string,
  boatClass: BoatClass,
  conditions: WeatherData
): Promise<{
  ml_score: number;
  probability_safe: number;
  hourly_risk: number[];
  safe_window: { start: number; end: number } | null;
  return_time: MLReturnTime | null;
}> => {
  // Return safe defaults if ML disabled or unreachable
  if (!ML_ENABLED) {
    console.log('[WeatherContext] ML disabled - using built-in scoring only');
    return {
      ml_score: 50,
      probability_safe: 0.5,
      hourly_risk: [],
      safe_window: null,
      return_time: null,
    };
  }

  const mlApiUrl = await resolveMLApiUrl();
  if (!mlApiUrl) {
    return {
      ml_score: 50,
      probability_safe: 0.5,
      hourly_risk: [],
      safe_window: null,
      return_time: null,
    };
  }

  try {
    const now = new Date();
    const tideStates = ['rising', 'high', 'falling', 'low'];
    const tideState = tideStates[Math.floor((now.getHours() % 24) / 6)];

    const toFiniteNumber = (value: unknown, fallback: number): number => {
      const n = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(n) ? n : fallback;
    };

    const safeZoneId = zoneId || 'TN-01';
    const safeBoatClass: BoatClass = boatClass === 'A' || boatClass === 'B' || boatClass === 'C' ? boatClass : 'A';
    const safeTideState = tideState || 'rising';

    const daySafetyRequest = {
      zone_id: safeZoneId,
      boat_class: safeBoatClass,
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      wave_height: toFiniteNumber(conditions.wave_height_m, 0),
      wind_speed: toFiniteNumber(conditions.wind_speed_kmh, 0),
      wind_gust: toFiniteNumber(conditions.wind_gust_kmh, 0),
      swell_height: toFiniteNumber(conditions.swell_height_m, 0),
      visibility: toFiniteNumber(conditions.visibility_km, 10),
      weather_code: Math.round(toFiniteNumber(conditions.weather_code, 0)),
      tide_state: safeTideState,
    };

    console.log('[WeatherContext] Calling ML at:', `${mlApiUrl}/predict/day-safety`);

    const daySafetyRes = await fetchWithTimeout(`${mlApiUrl}/predict/day-safety`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daySafetyRequest),
    }, 15000);

    if (!daySafetyRes.ok) {
      const errText = await daySafetyRes.text();
      console.error('[WeatherContext] ML day-safety error:', daySafetyRes.status, errText);
      throw new Error(`ML API error: ${daySafetyRes.status}`);
    }

    const daySafety: MLDaySafety = await daySafetyRes.json();
    console.log('[WeatherContext] ML Day Safety response:', daySafety);

    const hourlyRes = await fetchWithTimeout(`${mlApiUrl}/predict/hourly-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daySafetyRequest),
    }, 15000);

    let hourlyRisk: number[] = [];
    let safeWindow: { start: number; end: number } | null = null;
    if (hourlyRes.ok) {
      const hourlyData: MLHourlyRisk = await hourlyRes.json();
      hourlyRisk = hourlyData.hourly_risk;
      safeWindow = hourlyData.safe_window;
    } else {
      const hourlyErrText = await hourlyRes.text();
      console.warn('[WeatherContext] ML hourly-risk error:', hourlyRes.status, hourlyErrText);
    }

    let returnTime: MLReturnTime | null = null;
    const returnTimeRes = await fetchWithTimeout(`${mlApiUrl}/predict/return-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daySafetyRequest),
    }, 15000);

    if (returnTimeRes.ok) {
      returnTime = (await returnTimeRes.json()) as MLReturnTime;
    } else {
      const returnTimeErrText = await returnTimeRes.text();
      console.warn('[WeatherContext] ML return-time error:', returnTimeRes.status, returnTimeErrText);
    }

    return {
      ml_score: Math.round((1 - daySafety.probability_safe) * 100),
      probability_safe: daySafety.probability_safe,
      hourly_risk: hourlyRisk,
      safe_window: safeWindow,
      return_time: returnTime,
    };
  } catch (error) {
    resolvedMLApiUrl = null;
    console.error('[WeatherContext] ML call failed at endpoint:', mlApiUrl, error);
    return {
      ml_score: 50,
      probability_safe: 0.5,
      hourly_risk: [],
      safe_window: null,
      return_time: null,
    };
  }
};

export interface WeatherData {
  wave_height_m: number;
  wave_direction_deg: number;
  swell_height_m: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  wind_direction_deg: number;
  visibility_km: number;
  weather_code: number;
}

export interface TideData {
  high_tide_time: string;
  high_tide_height_m: number;
  low_tide_time: string;
  low_tide_height_m: number;
}

export interface OfficialAlert {
  source: 'IMD' | 'INCOIS';
  alert_type: string;
  severity: 'WARNING' | 'ADVISORY' | 'NONE';
  title_en: string;
  title_ta: string;
  valid_from: string;
  valid_until: string;
  issued_at: string;
}

export interface CycloneData {
  name: string;
  lat: number;
  lon: number;
  intensity: string;
  track: Array<{ time: string; lat: number; lon: number }>;
  landfall_eta: string | null;
  landfall_location: string | null;
}

export interface ZoneWeatherData {
  zone_id: string;
  fetched_at: string;
  data_freshness: 'live' | 'cached';
  risk_assessment: RiskAssessment;
  current_conditions: WeatherData;
  tidal_data: TideData;
  official_alerts: OfficialAlert[];
  cyclone_active: boolean;
  cyclone_data: CycloneData | null;
  forecast_48h: Array<{
    hour: string;
    wave_height_m: number;
    wind_speed_kmh: number;
    risk_score_computed: number;
  }>;
  return_time_prediction?: {
    estimated_hours: number;
    confidence: number;
    optimal_departure: number;
    model_used: string;
  } | null;
}

interface WeatherContextType {
  // Current zone data
  zoneData: ZoneWeatherData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  isOffline: boolean;
  
  // Actions
  fetchWeatherData: (zone: FishingZone, boatClass: BoatClass) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Community reports
  communityReports: CommunityReport[];
  submitReport: (report: Omit<CommunityReport, 'id' | 'submitted_at' | 'upvotes' | 'downvotes'>) => Promise<void>;
}

export interface CommunityReport {
  id: string;
  zone_id: string;
  location_lat: number;
  location_lon: number;
  submitted_at: string;
  wave_condition: 'calm' | 'small' | 'moderate' | 'high' | 'very_high';
  wind_strength: 'calm' | 'light' | 'moderate' | 'strong' | 'very_strong';
  visibility: 'clear' | 'hazy' | 'poor';
  overall: 'safe' | 'unsafe';
  note: string;
  upvotes: number;
  downvotes: number;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const CACHE_KEY = '@kadal_kavalan_weather';

// Mock data for demonstration
const createMockWeatherData = (zone: FishingZone, boatClass: BoatClass): ZoneWeatherData => {
  const risk = computeRiskScore(
    {
      wave_height_m: 1.5 + Math.random() * 1.5,
      wave_direction_deg: 225 + Math.random() * 30,
      swell_height_m: 0.8 + Math.random() * 0.8,
      wind_speed_kmh: 20 + Math.random() * 25,
      wind_gust_kmh: 25 + Math.random() * 30,
      wind_direction_deg: 210 + Math.random() * 30,
      visibility_km: 3 + Math.random() * 5,
      weather_code: Math.floor(Math.random() * 10),
    },
    { severity: 'NONE' },
    boatClass
  );

  const now = new Date();
  const forecast = [];
  for (let i = 0; i < 48; i++) {
    const hour = new Date(now.getTime() + i * 3600000);
    forecast.push({
      hour: hour.toISOString(),
      wave_height_m: 1.2 + Math.random() * 1.8,
      wind_speed_kmh: 18 + Math.random() * 28,
      risk_score_computed: 20 + Math.random() * 50,
    });
  }

  return {
    zone_id: zone.id,
    fetched_at: now.toISOString(),
    data_freshness: 'live',
    risk_assessment: risk,
    current_conditions: {
      wave_height_m: risk.conditions.wave_height,
      wave_direction_deg: 240,
      swell_height_m: risk.conditions.swell_height,
      wind_speed_kmh: risk.conditions.wind_speed,
      wind_gust_kmh: risk.conditions.wind_gust,
      wind_direction_deg: 215,
      visibility_km: risk.conditions.visibility,
      weather_code: 0,
    },
    tidal_data: {
      high_tide_time: '07:18',
      high_tide_height_m: 1.74,
      low_tide_time: '13:32',
      low_tide_height_m: 0.41,
    },
    official_alerts: [],
    cyclone_active: false,
    cyclone_data: null,
    forecast_48h: forecast,
    return_time_prediction: {
      estimated_hours: 6,
      confidence: 0.72,
      optimal_departure: 6,
      model_used: 'simulated',
    },
  };
};

export const WeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [zoneData, setZoneData] = useState<ZoneWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached) as ZoneWeatherData;
        const fetched = new Date(data.fetched_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - fetched.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 6) {
          setZoneData(data);
          setLastFetched(data.fetched_at);
          setIsOffline(true);
        }
      }
    } catch (err) {
      console.error('Error loading cached data:', err);
    }
  };

  const fetchWeatherData = useCallback(async (zone: FishingZone, boatClass: BoatClass) => {
    console.log('[WeatherContext] fetchWeatherData called for zone:', zone.id, 'boat:', boatClass);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[WeatherContext] Fetching REAL data from Open-Meteo API');
      
      // Fetch real marine weather data
      const marineData = await fetchMarineWeather(zone);
      console.log('[WeatherContext] Got real marine data - wave:', marineData.wave_height, 'wind:', marineData.wind_speed);
      
      // Calculate risk score using the marine weather service
      const riskScore = calculateRiskScore(marineData, boatClass);
      console.log('[WeatherContext] Calculated risk score:', riskScore);
      
      // Call ML backend to get additional predictions
      const mlData: WeatherData = {
        wave_height_m: marineData.wave_height,
        wave_direction_deg: marineData.wave_direction,
        swell_height_m: marineData.swell_height,
        wind_speed_kmh: marineData.wind_speed,
        wind_gust_kmh: marineData.wind_gust,
        wind_direction_deg: marineData.wind_direction,
        visibility_km: marineData.visibility / 1000,
        weather_code: marineData.weather_code,
      };

      console.log('[WeatherContext] Calling ML backend...');
      const ml_prediction = await callMLBackend(zone.id, boatClass, mlData);
      console.log('[WeatherContext] ML prediction received:', ml_prediction);

      // Blend ML score with risk score (30% ML + 70% Risk)
      const finalRiskScore = Math.round(ml_prediction.ml_score * 0.3 + riskScore * 0.7);
      console.log('[WeatherContext] Blended risk score:', finalRiskScore, '(ML:', ml_prediction.ml_score, '+ Risk:', riskScore, ')');
      
      const now = new Date();

      const formatHourLabel = (hour: number): string => {
        const normalized = ((hour % 24) + 24) % 24;
        const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
        const suffix = normalized >= 12 ? 'PM' : 'AM';
        return `${hour12}:00 ${suffix}`;
      };

      const safeWindowText = ml_prediction.safe_window
        ? `${formatHourLabel(ml_prediction.safe_window.start)} - ${formatHourLabel(ml_prediction.safe_window.end)}`
        : null;

      const hourlyForecast = ml_prediction.hourly_risk.length === 24
        ? ml_prediction.hourly_risk.map((risk, hour) => {
            const sampleTime = new Date(now);
            sampleTime.setHours(hour, 0, 0, 0);

            return {
              hour: sampleTime.toISOString(),
              wave_height_m: marineData.wave_height,
              wind_speed_kmh: marineData.wind_speed,
              risk_score_computed: Math.round(risk),
            };
          })
        : [];
      
      const data: ZoneWeatherData = {
        zone_id: zone.id,
        fetched_at: now.toISOString(),
        data_freshness: 'live',
        risk_assessment: {
          risk_score: finalRiskScore,
          risk_level: finalRiskScore >= 55 ? 'DANGER' : finalRiskScore >= 30 ? 'ADVISORY' : 'SAFE',
          boat_class: boatClass,
          safe_departure_window: safeWindowText,
          tomorrow_window: null,
          reason_code: 'OK',
          reason_text: finalRiskScore >= 55 ? 'Conditions may be dangerous' : finalRiskScore >= 30 ? 'Caution advised' : 'Conditions are favorable',
          conditions: {
            wave_height: marineData.wave_height,
            wind_speed: marineData.wind_speed,
            wind_gust: marineData.wind_gust,
            visibility: marineData.visibility / 1000,
            swell_height: marineData.swell_height,
          },
        },
        current_conditions: {
          wave_height_m: marineData.wave_height,
          wave_direction_deg: marineData.wave_direction,
          swell_height_m: marineData.swell_height,
          wind_speed_kmh: marineData.wind_speed,
          wind_gust_kmh: marineData.wind_gust,
          wind_direction_deg: marineData.wind_direction,
          visibility_km: marineData.visibility / 1000,
          weather_code: marineData.weather_code,
        },
        tidal_data: {
          high_tide_time: '07:18',
          high_tide_height_m: 1.74,
          low_tide_time: '13:32',
          low_tide_height_m: 0.41,
        },
        official_alerts: [],
        cyclone_active: false,
        cyclone_data: null,
        forecast_48h: hourlyForecast,
        return_time_prediction: ml_prediction.return_time,
      };
      
      console.log('[WeatherContext] Got REAL data, risk_score:', data.risk_assessment.risk_score);
      setZoneData(data);
      setLastFetched(data.fetched_at);
      setIsOffline(false);
      
      // Cache the data
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      console.log('[WeatherContext] Weather data cached');
    } catch (err) {
      console.error('[WeatherContext] API Error, falling back to mock:', err);
      // Fallback to mock data on error
      await new Promise(resolve => setTimeout(resolve, 800));
      const data = createMockWeatherData(zone, boatClass);
      setZoneData(data);
      setLastFetched(data.fetched_at);
      setIsOffline(true);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (zoneData) {
      // Would need zone and boatClass from user context
      // This is called from the UI to force refresh
    }
  }, [zoneData]);

  const submitReport = useCallback(async (report: Omit<CommunityReport, 'id' | 'submitted_at' | 'upvotes' | 'downvotes'>) => {
    const newReport: CommunityReport = {
      ...report,
      id: Math.random().toString(36).substr(2, 9),
      submitted_at: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
    };
    
    setCommunityReports(prev => [newReport, ...prev]);
    
    // In production, save to backend
    await AsyncStorage.setItem(
      '@kadal_kavalan_reports',
      JSON.stringify([newReport, ...communityReports])
    );
  }, [communityReports]);

  const value: WeatherContextType = {
    zoneData,
    isLoading,
    error,
    lastFetched,
    isOffline,
    fetchWeatherData,
    refreshData,
    communityReports,
    submitReport,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};