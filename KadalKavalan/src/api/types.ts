export type BoatClass = 'A' | 'B' | 'C';
export type Language = 'ta' | 'ml' | 'te' | 'or' | 'en';
export type RiskLevel = 'SAFE' | 'ADVISORY' | 'DANGER' | 'CYCLONE';

export interface Zone {
  id: string;
  name_en: string;
  name_ta: string;
  name_ml: string;
  name_te: string;
  name_or: string;
  centroid_lat: number;
  centroid_lon: number;
  coastal_state: string;
  primary_language: Language;
  imd_zone_code: string;
  incois_zone_code: string;
}

export interface UserPreferences {
  zone_id: string;
  boat_class: BoatClass;
  language: Language;
  notifications_enabled: boolean;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  morning_alert_time: string;
  has_completed_onboarding: boolean;
}

export interface BoatThresholds {
  max_wave_height: number;
  max_wind_speed: number;
  max_wind_gust: number;
  min_visibility: number;
  max_swell_height: number;
}

export const BOAT_CLASS_THRESHOLDS: Record<BoatClass, BoatThresholds> = {
  A: { max_wave_height: 1.0, max_wind_speed: 28, max_wind_gust: 35, min_visibility: 3, max_swell_height: 0.8 },
  B: { max_wave_height: 2.0, max_wind_speed: 40, max_wind_gust: 50, min_visibility: 2, max_swell_height: 1.5 },
  C: { max_wave_height: 3.5, max_wind_speed: 55, max_wind_gust: 65, min_visibility: 1, max_swell_height: 2.5 },
};

export interface MarineForecast {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    swell_wave_height: number[];
    wind_wave_height: number[];
  };
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    wind_gusts_10m?: number[];
    windspeed_10m?: number[];
    winddirection_10m?: number[];
    windgusts_10m?: number[];
    visibility: number[];
    precipitation: number[];
    weather_code?: number[];
    weathercode?: number[];
  };
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
  };
}

export interface TideData {
  timestamps: string[];
  heights: number[];
}

export interface CurrentConditions {
  wave_height_m: number;
  wave_direction_deg: number;
  swell_height_m: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  wind_direction_deg: number;
  visibility_km: number;
  weather_code: number;
  weather_description: string;
}

export interface HourlyForecast {
  hour: string;
  wave_height_m: number;
  wind_speed_kmh: number;
  risk_score: number;
}

export interface IMDWarning {
  id: string;
  zone: string;
  severity: 'WARNING' | 'ADVISORY' | 'NO_WARNING';
  title: string;
  valid_from: string;
  valid_until: string;
  issued_at: string;
  source: 'IMD';
}

export interface INCOISAlert {
  id: string;
  coast: string;
  wave_height_m: number;
  valid_from: string;
  valid_until: string;
  advisory_text: string;
  source: 'INCOIS';
}

export interface CycloneData {
  name: string;
  coordinates: { lat: number; lon: number };
  max_wind_kt: number;
  intensity: 'DEPRESSION' | 'CYCLONE' | 'SEVERE_CYCLONE' | 'SUPER_CYCLONE';
  track: { time: string; lat: number; lon: number }[];
  landfall_eta: string;
  landfall_location: string;
  distance_km: number;
}

export interface RiskAssessment {
  zone_id: string;
  fetched_at: string;
  data_freshness: 'live' | 'cached';
  risk_score: number;
  risk_level: RiskLevel;
  boat_class_used: BoatClass;
  safe_departure_window: { start: string; end: string } | null;
  tomorrow_window: { start: string; end: string } | null;
  reason_code: string;
  reason_text_en: string;
  reason_text_ta: string;
  reason_text_ml: string;
  reason_text_te: string;
  reason_text_or: string;
  current_conditions: CurrentConditions;
  tidal_data?: {
    high_tide_time: string;
    high_tide_height_m: number;
    low_tide_time: string;
    low_tide_height_m: number;
  };
  official_alerts: (IMDWarning | INCOISAlert)[];
  cyclone_active: boolean;
  cyclone_data: CycloneData | null;
  forecast_48h: HourlyForecast[];
}

export interface CommunityReport {
  id: string;
  zone_id: string;
  submitted_at: string;
  location_lat: number;
  location_lon: number;
  wave_height_estimate: 'calm' | 'small' | 'moderate' | 'high' | 'very_high';
  wind_strength: 'calm' | 'light' | 'moderate' | 'strong' | 'very_strong';
  visibility: 'clear' | 'hazy' | 'poor';
  sea_state: 'safe' | 'caution' | 'dangerous';
  overall_assessment: 'safe' | 'unsafe';
  text_note?: string;
  upvotes: number;
  downvotes: number;
}