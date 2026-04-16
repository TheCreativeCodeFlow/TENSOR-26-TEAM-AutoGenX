import { BoatClass, BoatThresholds, BOAT_CLASS_THRESHOLDS, RiskLevel, HourlyForecast, CurrentConditions, CycloneData } from '../api/types';

export interface RiskInput {
  wave_height_m: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  swell_height_m: number;
  visibility_km: number;
  imd_alert: 'WARNING' | 'ADVISORY' | 'NO_WARNING';
  incois_alert: boolean;
  incois_wave_height?: number;
  cyclone_active: boolean;
  cyclone_data?: CycloneData;
}

export interface RiskOutput {
  risk_score: number;
  risk_level: RiskLevel;
  safe_window: { start: string; end: string } | null;
  tomorrow_window: { start: string; end: string } | null;
  reason_code: string;
  reason_text_en: string;
}

export function getBoatThresholds(boatClass: BoatClass): BoatThresholds {
  return BOAT_CLASS_THRESHOLDS[boatClass];
}

function calculateSubScore(ratio: number): number {
  if (ratio <= 0.5) {
    return ratio * 40;
  } else if (ratio <= 0.75) {
    return 20 + ((ratio - 0.5) / 0.25) * 30;
  } else if (ratio <= 1.0) {
    return 50 + ((ratio - 0.75) / 0.25) * 30;
  } else {
    return Math.min(80 + (ratio - 1.0) * 50, 100);
  }
}

function calculateVisibilityScore(visibility: number, minVisibility: number): number {
  if (visibility >= minVisibility * 2) {
    return 0;
  } else if (visibility >= minVisibility) {
    return 30;
  } else if (visibility >= minVisibility * 0.5) {
    return 65;
  } else {
    return 90;
  }
}

function calculateIMDScore(imdAlert: 'WARNING' | 'ADVISORY' | 'NO_WARNING'): { score: number; floor: number } {
  switch (imdAlert) {
    case 'WARNING':
      return { score: 90, floor: 75 };
    case 'ADVISORY':
      return { score: 50, floor: 45 };
    default:
      return { score: 0, floor: 0 };
  }
}

export function calculateRiskScore(input: RiskInput, boatClass: BoatClass): RiskOutput {
  const thresholds = getBoatThresholds(boatClass);
  
  if (input.cyclone_active) {
    return {
      risk_score: 100,
      risk_level: 'CYCLONE',
      safe_window: null,
      tomorrow_window: null,
      reason_code: 'CYCLONE_ACTIVE',
      reason_text_en: `Cyclone "${input.cyclone_data?.name || 'Unknown'}" is active. Do not go to sea.`,
    };
  }

  const waveRatio = input.wave_height_m / thresholds.max_wave_height;
  const waveScore = calculateSubScore(waveRatio);

  const maxWind = Math.max(input.wind_speed_kmh, input.wind_gust_kmh * 0.8);
  const windRatio = maxWind / thresholds.max_wind_speed;
  const windScore = calculateSubScore(windRatio);

  const swellRatio = input.swell_height_m / thresholds.max_swell_height;
  const swellScore = calculateSubScore(swellRatio);

  const visScore = calculateVisibilityScore(input.visibility_km, thresholds.min_visibility);

  const imdResult = calculateIMDScore(input.imd_alert);
  const imdScore = imdResult.score;
  const floor = imdResult.floor;

  let incoisScore = 0;
  if (input.incois_alert && input.incois_wave_height) {
    const incoisRatio = input.incois_wave_height / thresholds.max_wave_height;
    incoisScore = Math.min(calculateSubScore(incoisRatio) * 0.5, 50);
  }

  const weightedScore = 
    (waveScore * 0.35) +
    (windScore * 0.30) +
    (swellScore * 0.15) +
    (visScore * 0.10) +
    (imdScore * 0.10) +
    (incoisScore * 0.05);

  const finalScore = Math.max(Math.round(Math.min(Math.max(weightedScore, floor), 100)), 0);

  let riskLevel: RiskLevel;
  if (finalScore < 30) {
    riskLevel = 'SAFE';
  } else if (finalScore < 55) {
    riskLevel = 'ADVISORY';
  } else {
    riskLevel = 'DANGER';
  }

  const reasonCode = getReasonCode(input, finalScore, riskLevel);
  const reasonTextEn = generateReasonText(input, riskLevel, thresholds);

  return {
    risk_score: finalScore,
    risk_level: riskLevel,
    safe_window: null,
    tomorrow_window: null,
    reason_code: reasonCode,
    reason_text_en: reasonTextEn,
  };
}

function getReasonCode(input: RiskInput, score: number, level: RiskLevel): string {
  if (input.cyclone_active) return 'CYCLONE';
  if (input.imd_alert === 'WARNING') return 'IMD_WARNING';
  if (input.imd_alert === 'ADVISORY') return 'IMD_ADVISORY';
  if (score >= 80) return 'EXTREME_CONDITIONS';
  if (input.wave_height_m > 2.0) return 'HIGH_WAVES';
  if (input.wind_speed_kmh > 40) return 'HIGH_WIND';
  if (input.visibility_km < 2) return 'LOW_VISIBILITY';
  if (input.incois_alert) return 'INCOIS_WARNING';
  return 'SAFE';
}

function generateReasonText(input: RiskInput, level: RiskLevel, thresholds: BoatThresholds): string {
  if (level === 'SAFE') {
    return 'Conditions are safe for your boat type. You can go out to sea.';
  }
  
  if (level === 'CYCLONE') {
    return 'Cyclone warning active. Do not go to sea. Stay ashore for safety.';
  }

  const reasons: string[] = [];
  
  if (input.wave_height_m > thresholds.max_wave_height) {
    reasons.push(`Wave height of ${input.wave_height_m}m exceeds safe limit of ${thresholds.max_wave_height}m`);
  }
  
  const maxWind = Math.max(input.wind_speed_kmh, input.wind_gust_kmh * 0.8);
  if (maxWind > thresholds.max_wind_speed) {
    reasons.push(`Wind speed of ${Math.round(maxWind)}km/h exceeds safe limit of ${thresholds.max_wind_speed}km/h`);
  }
  
  if (input.imd_alert === 'WARNING') {
    reasons.push('IMD has issued a fishermen warning for this coast');
  } else if (input.imd_alert === 'ADVISORY') {
    reasons.push('IMD has issued an advisory for this coast');
  }
  
  if (reasons.length === 0) {
    reasons.push('Conditions are borderline. Exercise caution.');
  }

  return reasons.join('. ') + '.';
}

export function findSafeDepartureWindow(
  hourlyForecasts: HourlyForecast[],
  boatClass: BoatClass
): { start: string; end: string } | null {
  if (hourlyForecasts.length === 0) return null;

  const threshold = boatClass === 'A' ? 40 : boatClass === 'B' ? 45 : 50;
  
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(4, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(10, 0, 0, 0);
  const todayEndLimit = new Date(now);
  todayEndLimit.setHours(18, 0, 0, 0);

  let safeBlocks: { start: Date; end: Date }[] = [];
  let currentBlock: { start: Date | null; end: Date } | null = null;

  hourlyForecasts.forEach((forecast) => {
    const forecastTime = new Date(forecast.hour);
    
    if (forecastTime < todayStart || forecastTime > todayEndLimit) return;
    if (forecastTime < now) return;

    const isSafe = forecast.risk_score < threshold;

    if (isSafe) {
      if (!currentBlock) {
        currentBlock = { start: forecastTime, end: forecastTime };
      } else {
        currentBlock.end = forecastTime;
      }
    } else {
      if (currentBlock && currentBlock.start >= todayStart && currentBlock.start <= todayEnd) {
        const duration = (currentBlock.end.getTime() - currentBlock.start.getTime()) / (1000 * 60 * 60);
        if (duration >= 3) {
          safeBlocks.push(currentBlock);
        }
      }
      currentBlock = null;
    }
  });

  if (currentBlock && currentBlock.start >= todayStart && currentBlock.start <= todayEnd) {
    const duration = (currentBlock.end.getTime() - currentBlock.start.getTime()) / (1000 * 60 * 60);
    if (duration >= 3) {
      safeBlocks.push(currentBlock);
    }
  }

  safeBlocks.sort((a, b) => (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime()));

  if (safeBlocks.length > 0) {
    const best = safeBlocks[0];
    return {
      start: formatTime(best.start),
      end: formatTime(best.end),
    };
  }

  return null;
}

export function findTomorrowWindow(
  hourlyForecasts: HourlyForecast[],
  boatClass: BoatClass
): { start: string; end: string } | null {
  if (hourlyForecasts.length === 0) return null;

  const threshold = boatClass === 'A' ? 40 : boatClass === 'B' ? 45 : 50;
  
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(4, 0, 0, 0);
  const tomorrowEnd = new Date(now);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  tomorrowEnd.setHours(10, 0, 0, 0);
  const tomorrowEndLimit = new Date(now);
  tomorrowEndLimit.setDate(tomorrowEndLimit.getDate() + 1);
  tomorrowEndLimit.setHours(18, 0, 0, 0);

  let safeBlocks: { start: Date; end: Date }[] = [];
  let currentBlock: { start: Date | null; end: Date } | null = null;

  hourlyForecasts.forEach((forecast) => {
    const forecastTime = new Date(forecast.hour);
    
    if (forecastTime < tomorrowStart || forecastTime > tomorrowEndLimit) return;

    const isSafe = forecast.risk_score < threshold;

    if (isSafe) {
      if (!currentBlock) {
        currentBlock = { start: forecastTime, end: forecastTime };
      } else {
        currentBlock.end = forecastTime;
      }
    } else {
      if (currentBlock && currentBlock.start >= tomorrowStart && currentBlock.start <= tomorrowEnd) {
        const duration = (currentBlock.end.getTime() - currentBlock.start.getTime()) / (1000 * 60 * 60);
        if (duration >= 3) {
          safeBlocks.push(currentBlock);
        }
      }
      currentBlock = null;
    }
  });

  if (currentBlock && currentBlock.start >= tomorrowStart && currentBlock.start <= tomorrowEnd) {
    const duration = (currentBlock.end.getTime() - currentBlock.start.getTime()) / (1000 * 60 * 60);
    if (duration >= 3) {
      safeBlocks.push(currentBlock);
    }
  }

  if (safeBlocks.length > 0) {
    const best = safeBlocks[0];
    return {
      start: formatTime(best.start),
      end: formatTime(best.end),
    };
  }

  return null;
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export function computeHourlyRiskScores(
  hourlyData: { time: string; wave_height: number; wind_speed: number; wind_gust: number }[],
  imdAlert: 'WARNING' | 'ADVISORY' | 'NO_WARNING',
  boatClass: BoatClass
): HourlyForecast[] {
  const thresholds = getBoatThresholds(boatClass);
  
  return hourlyData.map((data) => {
    const input: RiskInput = {
      wave_height_m: data.wave_height,
      wind_speed_kmh: data.wind_speed,
      wind_gust_kmh: data.wind_gust,
      swell_height_m: data.wave_height * 0.7,
      visibility_km: 10,
      imd_alert: 'NO_WARNING',
      incois_alert: false,
      cyclone_active: false,
    };
    
    const result = calculateRiskScore(input, boatClass);
    
    return {
      hour: data.time,
      wave_height_m: data.wave_height,
      wind_speed_kmh: data.wind_speed,
      risk_score: result.risk_score,
    };
  });
}