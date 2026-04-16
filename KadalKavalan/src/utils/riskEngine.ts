import { BoatClass, BOAT_CLASSES } from '../data/zones';

export type RiskLevel = 'SAFE' | 'ADVISORY' | 'DANGER' | 'CYCLONE';

export interface RiskConditions {
  wave_height: number;
  wind_speed: number;
  wind_gust: number;
  visibility: number;
  swell_height: number;
}

export type { RiskConditions as RiskConditionData };

export interface RiskAssessment {
  risk_score: number;
  risk_level: RiskLevel;
  boat_class: BoatClass;
  safe_departure_window: string | null;
  tomorrow_window: string | null;
  reason_code: string;
  reason_text: string;
  conditions: RiskConditions;
}

interface AlertOverride {
  severity: 'WARNING' | 'ADVISORY' | 'NONE';
}

// Compute wave sub-score
const computeWaveScore = (waveHeight: number, maxSafe: number): number => {
  const ratio = waveHeight / maxSafe;
  if (ratio <= 0.5) return ratio * 40;
  if (ratio <= 0.75) return 20 + ((ratio - 0.5) / 0.25) * 30;
  if (ratio <= 1.0) return 50 + ((ratio - 0.75) / 0.25) * 30;
  return Math.min(80 + (ratio - 1.0) * 50, 100);
};

// Compute wind sub-score
const computeWindScore = (windSpeed: number, windGust: number, maxSafeWind: number, maxSafeGust: number): number => {
  const effectiveWind = Math.max(windSpeed, windGust * 0.8);
  const ratio = effectiveWind / maxSafeWind;
  if (ratio <= 0.5) return ratio * 40;
  if (ratio <= 0.75) return 20 + ((ratio - 0.5) / 0.25) * 30;
  if (ratio <= 1.0) return 50 + ((ratio - 0.75) / 0.25) * 30;
  return Math.min(80 + (ratio - 1.0) * 50, 100);
};

// Compute visibility sub-score
const computeVisibilityScore = (visibility: number, minSafe: number): number => {
  if (visibility >= minSafe * 2) return 0;
  if (visibility >= minSafe) return 30;
  if (visibility >= minSafe * 0.5) return 65;
  return 90;
};

// Compute swell sub-score
const computeSwellScore = (swellHeight: number, maxSafe: number): number => {
  const ratio = swellHeight / maxSafe;
  if (ratio <= 0.5) return ratio * 40;
  if (ratio <= 0.75) return 20 + ((ratio - 0.5) / 0.25) * 30;
  if (ratio <= 1.0) return 50 + ((ratio - 0.75) / 0.25) * 30;
  return Math.min(80 + (ratio - 1.0) * 50, 100);
};

// Get risk level from score
const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 80) return 'DANGER';
  if (score >= 55) return 'DANGER';
  if (score >= 30) return 'ADVISORY';
  return 'SAFE';
};

// Compute safe departure window
const computeSafeWindow = (
  forecast: Array<{ hour: string; risk_score_computed: number }>,
  threshold: number
): { today: string | null; tomorrow: string | null } => {
  const now = new Date();
  const todayStart = now.getHours() + 1;
  const todayEnd = Math.min(todayStart + 12, 18);
  let todayWindow: string | null = null;
  let tomorrowWindow: string | null = null;

  // Analyze forecast for safe windows
  const safeHoursToday: number[] = [];
  const safeHoursTomorrow: number[] = [];

  forecast.forEach((f, i) => {
    const hourDate = new Date(f.hour);
    const hour = hourDate.getHours();
    const dateStr = hourDate.toDateString();
    const todayStr = now.toDateString();

    if (f.risk_score_computed < threshold) {
      if (dateStr === todayStr && hour >= todayStart && hour <= todayEnd) {
        safeHoursToday.push(hour);
      } else if (hour >= 4 && hour <= 18) {
        safeHoursTomorrow.push(hour);
      }
    }
  });

  if (safeHoursToday.length >= 3) {
    const start = Math.min(...safeHoursToday);
    const end = Math.max(...safeHoursToday);
    todayWindow = `${String(start).padStart(2, '0')}:00 - ${String(end).padStart(2, '0')}:00`;
  }

  if (safeHoursTomorrow.length >= 3) {
    const start = Math.min(...safeHoursTomorrow);
    const end = Math.max(...safeHoursTomorrow);
    tomorrowWindow = `${String(start).padStart(2, '0')}:00 - ${String(end).padStart(2, '0')}:00`;
  }

  return { today: todayWindow, tomorrow: tomorrowWindow };
};

export const computeRiskScore = (
  conditions: {
    wave_height_m: number;
    wind_speed_kmh: number;
    wind_gust_kmh: number;
    visibility_km: number;
    swell_height_m?: number;
    weather_code?: number;
  },
  alertOverride: AlertOverride,
  boatClass: BoatClass
): RiskAssessment => {
  const limits = BOAT_CLASSES[boatClass];
  const swell = conditions.swell_height_m || conditions.wave_height_m * 0.6;

  // Calculate sub-scores
  const waveScore = computeWaveScore(conditions.wave_height_m, limits.max_wave_height);
  const windScore = computeWindScore(
    conditions.wind_speed_kmh,
    conditions.wind_gust_kmh,
    limits.max_wind_speed,
    limits.max_wind_gust
  );
  const swellScore = computeSwellScore(swell, limits.max_swell_height);
  const visScore = computeVisibilityScore(conditions.visibility_km, limits.min_visibility);

  // IMD alert override
  let imdScore = 0;
  let floor = 0;
  if (alertOverride.severity === 'WARNING') {
    imdScore = 90;
    floor = 75;
  } else if (alertOverride.severity === 'ADVISORY') {
    imdScore = 50;
    floor = 45;
  }

  // Weighted calculation
  const weightedScore =
    waveScore * 0.35 +
    windScore * 0.3 +
    swellScore * 0.15 +
    visScore * 0.1 +
    imdScore * 0.1;

  const riskScore = Math.max(weightedScore, floor);
  const finalScore = Math.min(Math.round(riskScore), 100);
  const riskLevel = getRiskLevel(finalScore);

  // Generate reason text
  let reasonCode = 'OK';
  let reasonText = 'Conditions are safe for your boat type.';

  if (conditions.wave_height_m > limits.max_wave_height) {
    reasonCode = 'HIGH_WAVES';
    reasonText = `Wave height of ${conditions.wave_height_m.toFixed(1)}m exceeds your boat's safe limit of ${limits.max_wave_height}m.`;
  } else if (conditions.wind_speed_kmh > limits.max_wind_speed) {
    reasonCode = 'HIGH_WIND';
    reasonText = `Wind speed of ${conditions.wind_speed_kmh.toFixed(0)} km/h exceeds your boat's safe limit of ${limits.max_wind_speed} km/h.`;
  } else if (conditions.wind_gust_kmh > limits.max_wind_gust) {
    reasonCode = 'HIGH_GUST';
    reasonText = `Wind gusts of ${conditions.wind_gust_kmh.toFixed(0)} km/h exceed safe limits.`;
  } else if (conditions.visibility_km < limits.min_visibility) {
    reasonCode = 'LOW_VISIBILITY';
    reasonText = `Visibility of ${conditions.visibility_km.toFixed(1)} km is below safe minimum of ${limits.min_visibility} km.`;
  }

  if (alertOverride.severity === 'WARNING') {
    reasonCode = 'IMD_WARNING';
    reasonText = 'IMD has issued a fishermen warning for this area.';
  } else if (alertOverride.severity === 'ADVISORY') {
    reasonCode = 'IMD_ADVISORY';
    reasonText = 'IMD has issued a marine advisory.';
  }

  const threshold = boatClass === 'A' ? 40 : boatClass === 'B' ? 45 : 50;
  const window = computeSafeWindow([], threshold);

  return {
    risk_score: finalScore,
    risk_level: riskLevel,
    boat_class: boatClass,
    safe_departure_window: window.today,
    tomorrow_window: window.tomorrow,
    reason_code: reasonCode,
    reason_text: reasonText,
    conditions: {
      wave_height: conditions.wave_height_m,
      wind_speed: conditions.wind_speed_kmh,
      wind_gust: conditions.wind_gust_kmh,
      visibility: conditions.visibility_km,
      swell_height: swell,
    },
  };
};

// Get color for risk level
export const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case 'SAFE':
      return '#2D6A4F';
    case 'ADVISORY':
      return '#F77F00';
    case 'DANGER':
      return '#D62828';
    case 'CYCLONE':
      return '#7B2D8B';
    default:
      return '#666666';
  }
};

// Get background color for risk level
export const getRiskBgColor = (level: RiskLevel): string => {
  switch (level) {
    case 'SAFE':
      return '#2D6A4F20';
    case 'ADVISORY':
      return '#F77F0025';
    case 'DANGER':
      return '#D6282830';
    case 'CYCLONE':
      return '#7B2D8B35';
    default:
      return '#66666620';
  }
};