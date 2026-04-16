import { BoatClass, RiskLevel, HourlyForecast } from '../../src/api/types';
import { calculateRiskScore as calcCurrentRiskScore, RiskInput } from '../../src/services/riskScorer';
import { HFInferenceService, MLPredictions, DaySafetyPrediction, HourlyRiskPrediction, ReturnTimePrediction } from './hfInference';

export interface CombinedRiskInput {
  zone_id: string;
  boat_class: BoatClass;
  wave_height_m: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  swell_height_m: number;
  visibility_km: number;
  imd_alert?: 'WARNING' | 'ADVISORY' | 'NO_WARNING';
  incois_alert?: boolean;
  incois_wave_height?: number;
  cyclone_active?: boolean;
  cyclone_name?: string;
}

export interface CombinedRiskOutput {
  final_score: number;
  risk_level: RiskLevel;
  ml_score: number;
  current_score: number;
  baseline_score: number;
  contributions: {
    ml: number;
    current: number;
    baseline: number;
  };
  ml_prediction: MLContributions;
  safe_window: { start: string; end: string } | null;
  tomorrow_window: { start: string; end: string } | null;
  reason_code: string;
  reason_text_en: string;
}

export interface MLContributions {
  day_safety: DaySafetyPrediction;
  hourly_risk: HourlyRiskPrediction;
  return_time: ReturnTimePrediction;
}

const WEIGHTS = {
  ml: 0.30,
  current: 0.30,
  baseline: 0.40,
} as const;

export class MLRiskScorer {
  private inferenceService: HFInferenceService;
  private lastPredictions: MLPredictions | null = null;
  private cacheTTL: number = 15 * 60 * 1000;
  private lastFetch: number = 0;

  constructor(apiKey?: string) {
    this.inferenceService = new HFInferenceService(
      apiKey ? { apiKey, modelId: '' } : undefined
    );
  }

  async predict(
    input: CombinedRiskInput,
    hourlyData?: { time: string; wave_height: number; wind_speed: number; wind_gust: number }[]
  ): Promise<CombinedRiskOutput> {
    const currentScoreResult = this.calculateCurrentScore(input);
    const baselineScore = this.calculateBaselineScore(input);

    const mlPredictions = await this.getMLPredictions(input, hourlyData || []);

    const finalScore = Math.round(
      mlPredictions.ml_score * WEIGHTS.ml +
      currentScoreResult.score * WEIGHTS.current +
      baselineScore * WEIGHTS.baseline
    );

    const riskLevel = this.determineRiskLevel(finalScore);
    const safeWindow = this.findSafeWindow(hourlyData || [], input.boat_class);
    const tomorrowSafeWindow = this.findTomorrowSafeWindow(hourlyData || [], input.boat_class);

    return {
      final_score: finalScore,
      risk_level: riskLevel,
      ml_score: mlPredictions.ml_score,
      current_score: currentScoreResult.score,
      baseline_score: baselineScore,
      contributions: {
        ml: WEIGHTS.ml,
        current: WEIGHTS.current,
        baseline: WEIGHTS.baseline,
      },
      ml_prediction: {
        day_safety: mlPredictions.day_safety,
        hourly_risk: mlPredictions.hourly_risk,
        return_time: mlPredictions.return_time,
      },
      safe_window: safeWindow,
      tomorrow_window: tomorrowSafeWindow,
      reason_code: this.getReasonCode(input, finalScore, riskLevel),
      reason_text_en: this.generateReasonText(input, riskLevel, mlPredictions),
    };
  }

  private calculateCurrentScore(input: CombinedRiskInput): { score: number; floor: number } {
    const riskInput: RiskInput = {
      wave_height_m: input.wave_height_m,
      wind_speed_kmh: input.wind_speed_kmh,
      wind_gust_kmh: input.wind_gust_kmh,
      swell_height_m: input.swell_height_m,
      visibility_km: input.visibility_km,
      imd_alert: input.imd_alert || 'NO_WARNING',
      incois_alert: input.incois_alert || false,
      incois_wave_height: input.incois_wave_height,
      cyclone_active: input.cyclone_active || false,
      cyclone_data: input.cyclone_name ? { name: input.cyclone_name } : undefined,
    };

    const result = calcCurrentRiskScore(riskInput, input.boat_class);
    return { score: result.risk_score, floor: 0 };
  }

  private calculateBaselineScore(input: CombinedRiskInput): number {
    const thresholds = this.getBoatThresholds(input.boat_class);
    
    const waveRatio = input.wave_height_m / thresholds.max_wave_height;
    const windRatio = Math.max(input.wind_speed_kmh, input.wind_gust_kmh * 0.8) / thresholds.max_wind_speed;
    
    const avgRatio = (waveRatio + windRatio) / 2;
    return Math.min(100, Math.round(avgRatio * 100));
  }

  private async getMLPredictions(
    input: CombinedRiskInput,
    hourlyData: { time: string; wave_height: number; wind_speed: number; wind_gust: number }[]
  ): Promise<MLPredictions> {
    const now = Date.now();
    
    if (
      this.lastPredictions &&
      now - this.lastFetch < this.cacheTTL
    ) {
      return this.lastPredictions;
    }

    const conditions = {
      wave_height: input.wave_height_m,
      wind_speed: input.wind_speed_kmh,
      wind_gust: input.wind_gust_kmh,
      swell_height: input.swell_height_m,
      visibility: input.visibility_km * 1000,
      wave_direction: 0,
      wave_period: 0,
      swell_direction: 0,
      wind_direction: 0,
      weather_code: 0,
    };

    const hourlyConditions = hourlyData.map(d => ({
      ...conditions,
      wave_height: d.wave_height,
      wind_speed: d.wind_speed,
      wind_gust: d.wind_gust,
    }));

    try {
      const predictions = await this.inferenceService.getAllPredictions(
        input.zone_id,
        input.boat_class,
        conditions,
        hourlyConditions
      );

      this.lastPredictions = predictions;
      this.lastFetch = now;

      return predictions;
    } catch (error) {
      console.error('ML prediction error:', error);
      
      return {
        day_safety: { probability_safe: 0.5, confidence: 0, risk_factors: [] },
        hourly_risk: { hourly_risk: Array(24).fill(50) },
        return_time: { estimated_hours: 6, confidence: 0 },
        ml_score: 50,
        last_updated: now,
      };
    }
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score < 30) return 'SAFE';
    if (score < 55) return 'ADVISORY';
    return 'DANGER';
  }

  private getBoatThresholds(boatClass: BoatClass): {
    max_wave_height: number;
    max_wind_speed: number;
    max_swell_height: number;
    min_visibility: number;
  } {
    switch (boatClass) {
      case 'A':
        return { max_wave_height: 1.0, max_wind_speed: 28, max_swell_height: 0.8, min_visibility: 3 };
      case 'B':
        return { max_wave_height: 2.0, max_wind_speed: 40, max_swell_height: 1.5, min_visibility: 2 };
      case 'C':
        return { max_wave_height: 3.5, max_wind_speed: 55, max_swell_height: 2.5, min_visibility: 1 };
    }
  }

  private findSafeWindow(
    hourlyData: { time: string; wave_height: number; wind_speed: number; wind_gust: number }[],
    boatClass: BoatClass
  ): { start: string; end: string } | null {
    return this.findWindow(hourlyData, boatClass, false);
  }

  private findTomorrowSafeWindow(
    hourlyData: { time: string; wave_height: number; wind_speed: number; wind_gust: number }[],
    boatClass: BoatClass
  ): { start: string; end: string } | null {
    return this.findWindow(hourlyData, boatClass, true);
  }

  private findWindow(
    hourlyData: { time: string; wave_height: number; wind_speed: number; wind_gust: number }[],
    boatClass: BoatClass,
    isTomorrow: boolean
  ): { start: string; end: string } | null {
    if (hourlyData.length === 0) return null;

    const thresholds = this.getBoatThresholds(boatClass);
    const thresholdScore = thresholds.max_wave_height * 30 + thresholds.max_wind_speed;

    const now = new Date();
    if (isTomorrow) {
      now.setDate(now.getDate() + 1);
    }
    now.setHours(4, 0, 0, 0);
    const endTime = new Date(now);
    endTime.setHours(18, 0, 0, 0);

    let safeStart: Date | null = null;
    let safeEnd: Date | null = null;

    for (const data of hourlyData) {
      const forecastTime = new Date(data.time);
      
      if (forecastTime < now || forecastTime > endTime) continue;

      const score = data.wave_height * 30 + data.wind_speed;
      const isSafe = score < thresholdScore;

      if (isSafe && !safeStart) {
        safeStart = forecastTime;
        safeEnd = forecastTime;
      } else if (isSafe && safeEnd) {
        safeEnd = forecastTime;
      } else if (!isSafe && safeStart && safeEnd) {
        break;
      }
    }

    if (safeStart && safeEnd) {
      return {
        start: this.formatTime(safeStart),
        end: this.formatTime(safeEnd),
      };
    }

    return null;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  private getReasonCode(input: CombinedRiskInput, score: number, level: RiskLevel): string {
    if (input.cyclone_active) return 'CYCLONE';
    if (input.imd_alert === 'WARNING') return 'IMD_WARNING';
    if (input.imd_alert === 'ADVISORY') return 'IMD_ADVISORY';
    if (score >= 80) return 'EXTREME_CONDITIONS';
    if (input.wave_height_m > 2.0) return 'HIGH_WAVES';
    if (input.wind_speed_kmh > 40) return 'HIGH_WIND';
    if (input.visibility_km < 2) return 'LOW_VISIBILITY';
    if (input.incois_alert) return 'INCOIS_WARNING';
    return level === 'SAFE' ? 'SAFE' : 'CAUTION';
  }

  private generateReasonText(
    input: CombinedRiskInput,
    level: RiskLevel,
    mlPredictions: MLPredictions
  ): string {
    if (level === 'SAFE') {
      return 'Conditions are safe for your boat type. You can go out to sea.';
    }

    if (level === 'CYCLONE' || input.cyclone_active) {
      return 'Cyclone warning active. Do not go to sea. Stay ashore for safety.';
    }

    const reasons: string[] = [];

    const riskFactors = mlPredictions.day_safety.risk_factors;
    if (riskFactors && riskFactors.length > 0) {
      reasons.push(...riskFactors);
    }

    if (input.wave_height_m > 1.0) {
      reasons.push(`Wave height of ${input.wave_height_m}m is elevated`);
    }

    if (input.wind_speed_kmh > 25) {
      reasons.push(`Wind speed of ${input.wind_speed_kmh}km/h is high`);
    }

    if (input.imd_alert === 'WARNING') {
      reasons.push('IMD has issued a fishermen warning');
    } else if (input.imd_alert === 'ADVISORY') {
      reasons.push('IMD has issued an advisory');
    }

    if (reasons.length === 0) {
      reasons.push('Conditions are borderline. Exercise caution.');
    }

    return reasons.slice(0, 3).join('. ') + '.';
  }

  setCacheTTL(ttlMs: number): void {
    this.cacheTTL = ttlMs;
    this.inferenceService.setCacheTTL(ttlMs);
  }

  clearCache(): void {
    this.lastPredictions = null;
    this.lastFetch = 0;
    this.inferenceService.clearCache();
  }
}

export const defaultMLRiskScorer = new MLRiskScorer();

export default MLRiskScorer;