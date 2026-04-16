import { BoatClass } from '../../src/data/zones';
import { MarineWeatherData } from '../../src/services/marineWeather';

// Change this to your backend URL
const HF_INFERENCE_URL = 'http://localhost:8001';
// For production: const HF_INFERENCE_URL = 'https://your-backend.onrender.com';

export interface MLConfig {
  apiKey?: string;
  endpoint?: string;
  modelId: string;
}

export const ML_MODELS = {
  daySafety: {
    modelId: 'day-safety',
  },
  hourlyRisk: {
    modelId: 'hourly-risk',
  },
  returnTime: {
    modelId: 'return-time',
  },
};

export interface DaySafetyPrediction {
  probability_safe: number;
  confidence: number;
  risk_factors: string[];
}

export interface HourlyRiskPrediction {
  hourly_risk: number[];
  safe_window_start?: number;
  safe_window_end?: number;
}

export interface ReturnTimePrediction {
  estimated_hours: number;
  confidence: number;
  optimal_departure_time?: number;
}

export interface MLPredictions {
  day_safety: DaySafetyPrediction;
  hourly_risk: HourlyRiskPrediction;
  return_time: ReturnTimePrediction;
  ml_score: number;
  last_updated: number;
}

function mapBoatClass(classification: string): BoatClass {
  const map: Record<string, BoatClass> = {
    'small': 'A',
    'medium': 'B',
    'large': 'C',
    'vallam': 'A',
    'catamaran': 'A',
    'country craft': 'B',
    'trawler': 'C',
    'mechanized': 'C',
  };
  return map[classification.toLowerCase()] || 'A';
}

function mapBoatClassFromEnum(boatClass: BoatClass): string {
  return boatClass.toLowerCase();
}

function getTideState(): string {
  const hour = new Date().getHours();
  const position = hour % 24.84;
  if (position < 6) return 'rising';
  if (position < 12) return 'high';
  if (position < 18) return 'falling';
  return 'low';
}

function mapBoatClass(boatClass: BoatClass): string {
  return boatClass.toLowerCase();
}

function prepareDaySafetyInput(
  zoneId: string,
  boatClass: BoatClass,
  conditions: MarineWeatherData
): Record<string, unknown> {
  const date = new Date();
  return {
    zone_id: zoneId,
    boat_class: mapBoatClass(boatClass),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    wave_height: conditions.wave_height,
    wind_speed: conditions.wind_speed,
    wind_gust: conditions.wind_gust,
    swell_height: conditions.swell_height,
    visibility: conditions.visibility / 1000,
    weather_code: conditions.weather_code,
    tide_state: getTideState(),
  };
}

function prepareHourlyRiskInput(
  zoneId: string,
  boatClass: BoatClass,
  conditions: MarineWeatherData
): Record<string, unknown> {
  const date = new Date();
  return {
    zone_id: zoneId,
    boat_class: mapBoatClass(boatClass),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    wave_height: conditions.wave_height,
    wind_speed: conditions.wind_speed,
    wind_gust: conditions.wind_gust,
    swell_height: conditions.swell_height,
    visibility: conditions.visibility / 1000,
    weather_code: conditions.weather_code,
    tide_state: getTideState(),
  };
}

function prepareReturnTimeInput(
  zoneId: string,
  boatClass: BoatClass,
  conditions: MarineWeatherData,
  departureHour: number
): Record<string, unknown> {
  const date = new Date();
  return {
    zone_id: zoneId,
    boat_class: mapBoatClass(boatClass),
    month: date.getMonth() + 1,
    departure_hour: departureHour,
    wave_height: conditions.wave_height,
    wind_speed: conditions.wind_speed,
    wind_gust: conditions.wind_gust,
    swell_height: conditions.swell_height,
    visibility: conditions.visibility / 1000,
    weather_code: conditions.weather_code,
    tide_state: getTideState(),
  };
}
  };
}

// Map model IDs to backend endpoints
const ENDPOINTS: Record<string, string> = {
  'day-safety': 'predict/day-safety',
  'hourly-risk': 'predict/hourly-risk',
  'return-time': 'predict/return-time',
};

async function callHFInference(
  modelId: string,
  inputs: Record<string, unknown>,
  config?: MLConfig
): Promise<unknown> {
  const endpointPath = ENDPOINTS[modelId] || `predict/${modelId}`;
  const url = config?.endpoint || `${HF_INFERENCE_URL}/${endpointPath}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Inference error for ${modelId}:`, error);
    throw error;
  }
}

function simulateDaySafetyPrediction(
  conditions: MarineWeatherData,
  boatClass: BoatClass
): DaySafetyPrediction {
  const waveRisk = conditions.wave_height > 1.5 ? 0.3 : 0.7;
  const windRisk = conditions.wind_speed > 30 ? 0.4 : 0.6;
  const swellRisk = conditions.swell_height > 1.0 ? 0.35 : 0.65;
  const visRisk = conditions.visibility < 3000 ? 0.4 : 0.6;

  const probability = (waveRisk + windRisk + swellRisk + visRisk) / 4;
  const riskFactors: string[] = [];

  if (conditions.wave_height > 1.0) riskFactors.push('High wave height');
  if (conditions.wind_speed > 25) riskFactors.push('Strong winds');
  if (conditions.swell_height > 0.8) riskFactors.push('Large swell');
  if (conditions.visibility < 5000) riskFactors.push('Poor visibility');

  return {
    probability_safe: probability,
    confidence: 0.75 + Math.random() * 0.2,
    risk_factors: riskFactors,
  };
}

function simulateHourlyRiskPrediction(
  hourlyConditions: MarineWeatherData[],
  boatClass: BoatClass
): HourlyRiskPrediction {
  const hourlyRisk = hourlyConditions.slice(0, 24).map((c, i) => {
    const hourFactor = (i >= 6 && i <= 10) ? 0.8 : (i >= 14 && i <= 17) ? 0.7 : 1.0;
    const baseRisk = Math.min(
      100,
      Math.max(
        0,
        (c.wave_height * 20 + c.wind_speed * 1.5 + c.swell_height * 15) * hourFactor
      )
    );
    return Math.round(baseRisk);
  });

  const safeIndices = hourlyRisk
    .map((risk, i) => ({ risk, hour: i }))
    .filter(item => item.risk < 35)
    .map(item => item.hour);

  let safeWindowStart: number | undefined;
  let safeWindowEnd: number | undefined;

  if (safeIndices.length > 0) {
    safeWindowStart = Math.min(...safeIndices);
    safeWindowEnd = Math.max(...safeIndices);
  }

  return {
    hourly_risk: hourlyRisk,
    safe_window_start: safeWindowStart,
    safe_window_end: safeWindowEnd,
  };
}

function simulateReturnTimePrediction(
  conditions: MarineWeatherData,
  boatClass: BoatClass
): ReturnTimePrediction {
  const boatLimits = {
    A: { wave: 1.0, wind: 28 },
    B: { wave: 2.0, wind: 40 },
    C: { wave: 3.5, wind: 55 },
  }[boatClass];

  const waveExcess = Math.max(0, conditions.wave_height - boatLimits.wave * 0.5);
  const windExcess = Math.max(0, conditions.wind_speed - boatLimits.wind * 0.5);

  const baseHours = 6;
  const additionalHours = waveExcess * 2 + windExcess * 0.1;

  const estimatedHours = Math.min(12, Math.max(3, Math.round(baseHours + additionalHours)));

  const optimalHour = (
    conditions.wind_speed < 15 && conditions.wave_height < 0.8
  ) ? 6 : (
    conditions.wind_speed < 20 ? 7 : 8
  );

  return {
    estimated_hours: estimatedHours,
    confidence: 0.7 + Math.random() * 0.25,
    optimal_departure_time: optimalHour,
  };
}

function calculateMLScore(predictions: MLPredictions): number {
  const daySafetyWeight = 0.4;
  const hourlyRiskWeight = 0.35;
  const returnTimeWeight = 0.25;

  const dayScore = (1 - predictions.day_safety.probability_safe) * 100;
  const hourlyAvg =
    predictions.hourly_risk.hourly_risk.reduce((a, b) => a + b, 0) /
    predictions.hourly_risk.hourly_risk.length;
  const returnScore = Math.min(100, (predictions.return_time.estimated_hours / 10) * 100);

  return Math.round(
    dayScore * daySafetyWeight +
    hourlyAvg * hourlyRiskWeight +
    returnScore * returnTimeWeight
  );
}

export class HFInferenceService {
  private config?: MLConfig;
  private predictions: MLPredictions | null = null;
  private lastFetch: number = 0;
  private cacheTTL: number = 15 * 60 * 1000;

  constructor(config?: MLConfig) {
    this.config = config;
  }

  async predictDaySafety(
    zoneId: string,
    boatClass: BoatClass,
    conditions: MarineWeatherData
  ): Promise<DaySafetyPrediction> {
    try {
      const input = prepareDaySafetyInput(zoneId, boatClass, conditions);

      if (this.config?.apiKey) {
        const result = await callHFInference(
          ML_MODELS.daySafety.modelId,
          input,
          this.config
        ) as DaySafetyPrediction;
        return result;
      }
    } catch (error) {
      console.warn('HF Day Safety prediction failed, using simulation:', error);
    }

    return simulateDaySafetyPrediction(conditions, boatClass);
  }

  async predictHourlyRisk(
    hourlyConditions: MarineWeatherData[],
    boatClass: BoatClass
  ): Promise<HourlyRiskPrediction> {
    try {
      const input = prepareHourlyRiskInput(hourlyConditions);

      if (this.config?.apiKey) {
        const result = await callHFInference(
          ML_MODELS.hourlyRisk.modelId,
          input,
          this.config
        ) as HourlyRiskPrediction;
        return result;
      }
    } catch (error) {
      console.warn('HF Hourly Risk prediction failed, using simulation:', error);
    }

    return simulateHourlyRiskPrediction(hourlyConditions, boatClass);
  }

  async predictReturnTime(
    zoneId: string,
    boatClass: BoatClass,
    conditions: MarineWeatherData,
    departureHour: number = 6
  ): Promise<ReturnTimePrediction> {
    try {
      const input = prepareReturnTimeInput(zoneId, boatClass, conditions, departureHour);

      if (this.config?.apiKey) {
        const result = await callHFInference(
          ML_MODELS.returnTime.modelId,
          input,
          this.config
        ) as ReturnTimePrediction;
        return result;
      }
    } catch (error) {
      console.warn('HF Return Time prediction failed, using simulation:', error);
    }

    return simulateReturnTimePrediction(conditions, boatClass);
  }

  async getAllPredictions(
    zoneId: string,
    boatClass: BoatClass,
    conditions: MarineWeatherData,
    hourlyConditions: MarineWeatherData[] = []
  ): Promise<MLPredictions> {
    const now = Date.now();

    if (
      this.predictions &&
      now - this.lastFetch < this.cacheTTL
    ) {
      return this.predictions;
    }

    const [day_safety, hourly_risk, return_time] = await Promise.all([
      this.predictDaySafety(zoneId, boatClass, conditions),
      this.predictHourlyRisk(hourlyConditions.length > 0 ? hourlyConditions : [conditions], boatClass),
      this.predictReturnTime(zoneId, boatClass, conditions),
    ]);

    this.predictions = {
      day_safety,
      hourly_risk,
      return_time,
      ml_score: 0,
      last_updated: now,
    };

    this.predictions.ml_score = calculateMLScore(this.predictions);
    this.lastFetch = now;

    return this.predictions;
  }

  clearCache(): void {
    this.predictions = null;
    this.lastFetch = 0;
  }

  setCacheTTL(ttlMs: number): void {
    this.cacheTTL = ttlMs;
  }

  getLastPrediction(): MLPredictions | null {
    return this.predictions;
  }
}

export const defaultInferenceService = new HFInferenceService();

export default HFInferenceService;