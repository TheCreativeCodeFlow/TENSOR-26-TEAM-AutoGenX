import { BoatClass, Zone } from '../../src/data/zones';

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

export interface MLPredictionInput {
  zone_id: string;
  boat_class: BoatClass;
  timestamp?: number;
}

export interface CombinedRiskScore {
  final_score: number;
  ml_contribution: number;
  current_contribution: number;
  baseline_contribution: number;
  ml_prediction: MLPredictions;
}

export interface ModelMetadata {
  model_id: string;
  model_type: 'day_safety' | 'hourly_risk' | 'return_time';
  version: string;
  trained_at: number;
  accuracy?: number;
  f1_score?: number;
}

export interface HFModelConfig {
  apiKey?: string;
  endpoint?: string;
  modelIds: {
    daySafety: string;
    hourlyRisk: string;
    returnTime: string;
  };
}

export const DEFAULT_MODEL_CONFIG: HFModelConfig = {
  modelIds: {
    daySafety: 'kadal-kavalan/day-safety-predictor',
    hourlyRisk: 'kadal-kavalan/hourly-risk-predictor',
    returnTime: 'kadal-kavalan/return-time-estimator',
  },
};

export const WEIGHTS = {
  ml: 0.30,
  current: 0.30,
  baseline: 0.40,
} as const;

export type { BoatClass, Zone };