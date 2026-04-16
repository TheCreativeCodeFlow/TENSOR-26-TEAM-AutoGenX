import { HistoricalDataPoint } from './fetch_historical_data';
import { calculateRiskScore, MarineWeatherData } from '../../src/services/marineWeather';
import { BoatClass } from '../../src/data/zones';

export interface LabeledDataPoint extends HistoricalDataPoint {
  target_day_safe: number;
  target_hourly_risk: number;
  target_return_hours: number;
}

const BOAT_CLASS_LIMITS = {
  A: { wave: 1.0, wind: 28, gust: 35, visibility: 3 },
  B: { wave: 2.0, wind: 40, gust: 50, visibility: 2 },
  C: { wave: 3.5, wind: 55, gust: 65, visibility: 1 },
};

function generateDaySafeLabel(
  waveHeight: number,
  windSpeed: number,
  windGust: number,
  swellHeight: number,
  visibility: number,
  boatClass: BoatClass
): number {
  const limits = BOAT_CLASS_LIMITS[boatClass];
  const maxWaveFactor = Math.max(waveHeight, swellHeight) / limits.wave;
  const maxWindFactor = Math.max(windSpeed, windGust * 0.8) / limits.wind;

  const riskScore = calculateRiskScore(
    {
      wave_height: waveHeight,
      wind_speed: windSpeed,
      wind_gust: windGust,
      swell_height: swellHeight,
      visibility: visibility * 1000,
      wave_direction: 0,
      wave_period: 0,
      swell_direction: 0,
      wind_direction: 0,
      weather_code: 0,
    },
    boatClass
  );

  return riskScore < 30 ? 1 : 0;
}

function generateHourlyRiskLabel(
  waveHeight: number,
  windSpeed: number,
  windGust: number,
  swellHeight: number,
  visibility: number,
  boatClass: BoatClass
): number {
  const marineData: MarineWeatherData = {
    wave_height: waveHeight,
    wind_speed: windSpeed,
    wind_gust: windGust,
    swell_height: swellHeight,
    visibility: visibility * 1000,
    wave_direction: 0,
    wave_period: 0,
    swell_direction: 0,
    wind_direction: 0,
    weather_code: 0,
  };

  return calculateRiskScore(marineData, boatClass);
}

function generateReturnTimeLabel(
  waveHeight: number,
  windSpeed: number,
  swellHeight: number,
  boatClass: BoatClass
): number {
  const limits = BOAT_CLASS_LIMITS[boatClass];

  const baseTime = 6;
  const waveDelay = Math.max(0, (waveHeight - limits.wave * 0.5)) * 2;
  const windDelay = Math.max(0, (windSpeed - limits.wind * 0.5)) * 1;
  const swellDelay = Math.max(0, (swellHeight - limits.wave * 0.3)) * 1;

  const adjustedTime = baseTime + waveDelay + windDelay + swellDelay;
  return Math.min(12, Math.max(2, Math.round(adjustedTime)));
}

export function generateLabels(data: HistoricalDataPoint[]): LabeledDataPoint[] {
  console.log(`Generating labels for ${data.length} data points...`);

  const labeledData = data.map((point, index) => {
    const daySafe = generateDaySafeLabel(
      point.wave_height,
      point.wind_speed,
      point.wind_gust,
      point.swell_height,
      point.visibility,
      point.boat_class
    );

    const hourlyRisk = generateHourlyRiskLabel(
      point.wave_height,
      point.wind_speed,
      point.wind_gust,
      point.swell_height,
      point.visibility,
      point.boat_class
    );

    const returnHours = generateReturnTimeLabel(
      point.wave_height,
      point.wind_speed,
      point.swell_height,
      point.boat_class
    );

    if (index % 50000 === 0) {
      console.log(`Processed ${index}/${data.length} rows...`);
    }

    return {
      ...point,
      target_day_safe: daySafe,
      target_hourly_risk: hourlyRisk,
      target_return_hours: returnHours,
    };
  });

  const safeCount = labeledData.filter(d => d.target_day_safe === 1).length;
  const unsafeCount = labeledData.length - safeCount;
  console.log(`Label distribution: SAFE=${safeCount}, UNSAFE=${unsafeCount}`);

  const avgRisk = labeledData.reduce((sum, d) => sum + d.target_hourly_risk, 0) / labeledData.length;
  console.log(`Average risk score: ${avgRisk.toFixed(1)}`);

  const avgReturn = labeledData.reduce((sum, d) => sum + d.target_return_hours, 0) / labeledData.length;
  console.log(`Average return time: ${avgReturn.toFixed(1)} hours`);

  return labeledData;
}

export function saveLabeledCSV(data: LabeledDataPoint[]): string {
  const headers = [
    'zone_id',
    'boat_class',
    'timestamp',
    'month',
    'day',
    'hour',
    'wave_height',
    'wind_speed',
    'wind_gust',
    'swell_height',
    'visibility',
    'weather_code',
    'tide_state',
    'target_day_safe',
    'target_hourly_risk',
    'target_return_hours',
  ].join(',');

  const rows = data.map(point => [
    point.zone_id,
    point.boat_class,
    point.timestamp,
    point.month,
    point.day,
    point.hour,
    point.wave_height.toFixed(2),
    point.wind_speed.toFixed(1),
    point.wind_gust.toFixed(1),
    point.swell_height.toFixed(2),
    point.visibility.toFixed(2),
    point.weather_code,
    point.tide_state,
    point.target_day_safe,
    point.target_hourly_risk,
    point.target_return_hours,
  ].join(','));

  return [headers, ...rows].join('\n');
}

async function main() {
  console.log('=== Label Generation ===');
  console.log('Using existing risk scorer to auto-label historical data\n');

  const fs = require('fs');
  const path = require('path');

  const inputPath = path.join(__dirname, '..', 'data', 'historical_data.csv');
  console.log(`Loading data from: ${inputPath}`);

  if (!fs.existsSync(inputPath)) {
    console.error('Error: historical_data.csv not found!');
    console.error('Please run fetch_historical_data.ts first');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');

  const data: HistoricalDataPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 12) continue;

    data.push({
      zone_id: values[0],
      boat_class: values[1] as BoatClass,
      timestamp: values[2],
      month: parseInt(values[3]),
      day: parseInt(values[4]),
      hour: parseInt(values[5]),
      wave_height: parseFloat(values[6]),
      wind_speed: parseFloat(values[7]),
      wind_gust: parseFloat(values[8]),
      swell_height: parseFloat(values[9]),
      visibility: parseFloat(values[10]),
      weather_code: parseInt(values[11]),
      tide_state: values[12],
    });
  }

  console.log(`Loaded ${data.length} data points\n`);

  const labeled = generateLabels(data);
  const csv = saveLabeledCSV(labeled);

  const outputPath = path.join(__dirname, '..', 'data', 'labeled_data.csv');
  fs.writeFileSync(outputPath, csv);
  console.log(`\nSaved labeled data to: ${outputPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}