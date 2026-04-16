import { LabeledDataPoint } from './generate_labels';

export interface HFDatasetDaySafety {
  zone_id: string;
  boat_class: string;
  month: number;
  day: number;
  hour: number;
  wave_height: number;
  wind_speed: number;
  wind_gust: number;
  swell_height: number;
  visibility: number;
  weather_code: number;
  tide_state: string;
  target_day_safe: number;
}

export interface HFDatasetHourlyRisk {
  zone_id: string;
  boat_class: string;
  month: number;
  day: number;
  wave_height_0: number;
  wind_speed_0: number;
  swell_height_0: number;
  wave_height_6: number;
  wind_speed_6: number;
  swell_height_6: number;
  wave_height_12: number;
  wind_speed_12: number;
  swell_height_12: number;
  wave_height_18: number;
  wind_speed_18: number;
  swell_height_18: number;
  target_risk_avg: number;
  target_risk_0: number;
  target_risk_6: number;
  target_risk_12: number;
  target_risk_18: number;
}

export interface HFDatasetReturnTime {
  zone_id: string;
  boat_class: string;
  month: number;
  departure_hour: number;
  wave_height: number;
  wind_speed: number;
  swell_height: number;
  visibility: number;
  target_return_hours: number;
}

function normalizeBoatClass(boatClass: string): string {
  const map: Record<string, string> = {
    A: 'small',
    B: 'medium',
    C: 'large',
  };
  return map[boatClass] || 'small';
}

export function prepareDaySafetyDataset(data: LabeledDataPoint[]): HFDatasetDaySafety[] {
  console.log(`Preparing Day Safety dataset from ${data.length} rows...`);

  const dataset = data.map(point => ({
    zone_id: point.zone_id,
    boat_class: normalizeBoatClass(point.boat_class),
    month: point.month,
    day: point.day,
    hour: point.hour,
    wave_height: Math.round(point.wave_height * 100) / 100,
    wind_speed: Math.round(point.wind_speed * 10) / 10,
    wind_gust: Math.round(point.wind_gust * 10) / 10,
    swell_height: Math.round(point.swell_height * 100) / 100,
    visibility: Math.round(point.visibility * 100) / 100,
    weather_code: point.weather_code,
    tide_state: point.tide_state,
    target_day_safe: point.target_day_safe,
  }));

  const safeCount = dataset.filter(d => d.target_day_safe === 1).length;
  console.log(`Day Safety: SAFE=${safeCount}, UNSAFE=${dataset.length - safeCount}`);

  return dataset;
}

export function prepareHourlyRiskDataset(data: LabeledDataPoint[]): HFDatasetHourlyRisk[] {
  console.log(`Preparing Hourly Risk dataset from ${data.length} rows...`);

  const groupedByDay = new Map<string, LabeledDataPoint[]>();

  for (const point of data) {
    const key = `${point.zone_id}_${point.boat_class}_${point.timestamp.split('T')[0]}`;
    const existing = groupedByDay.get(key) || [];
    existing.push(point);
    groupedByDay.set(key, existing);
  }

  const dataset: HFDatasetHourlyRisk[] = [];

  for (const [, points] of groupedByDay) {
    if (points.length < 24) continue;

    const getAtHour = (hour: number) => points.find(p => new Date(p.timestamp).getHours() === hour);

    const h0 = getAtHour(0);
    const h6 = getAtHour(6);
    const h12 = getAtHour(12);
    const h18 = getAtHour(18);

    if (!h0 || !h6 || !h12 || !h18) continue;

    const riskValues = points.map(p => p.target_hourly_risk);
    const avgRisk = riskValues.reduce((a, b) => a + b, 0) / riskValues.length;

    const firstPoint = points[0];
    const timestamp = new Date(firstPoint.timestamp);

    dataset.push({
      zone_id: firstPoint.zone_id,
      boat_class: normalizeBoatClass(firstPoint.boat_class),
      month: timestamp.getMonth() + 1,
      day: timestamp.getDate(),
      wave_height_0: Math.round(h0.wave_height * 100) / 100,
      wind_speed_0: Math.round(h0.wind_speed * 10) / 10,
      swell_height_0: Math.round(h0.swell_height * 100) / 100,
      wave_height_6: Math.round(h6.wave_height * 100) / 100,
      wind_speed_6: Math.round(h6.wind_speed * 10) / 10,
      swell_height_6: Math.round(h6.swell_height * 100) / 100,
      wave_height_12: Math.round(h12.wave_height * 100) / 100,
      wind_speed_12: Math.round(h12.wind_speed * 10) / 10,
      swell_height_12: Math.round(h12.swell_height * 100) / 100,
      wave_height_18: Math.round(h18.wave_height * 100) / 100,
      wind_speed_18: Math.round(h18.wind_speed * 10) / 10,
      swell_height_18: Math.round(h18.swell_height * 100) / 100,
      target_risk_avg: Math.round(avgRisk),
      target_risk_0: h0.target_hourly_risk,
      target_risk_6: h6.target_hourly_risk,
      target_risk_12: h12.target_hourly_risk,
      target_risk_18: h18.target_hourly_risk,
    });
  }

  console.log(`Hourly Risk: ${dataset.length} daily records`);

  const avgRisk = dataset.map(d => d.target_risk_avg);
  console.log(`Average risk: ${(avgRisk.reduce((a, b) => a + b, 0) / avgRisk.length).toFixed(1)}`);

  return dataset;
}

export function prepareReturnTimeDataset(data: LabeledDataPoint[]): HFDatasetReturnTime[] {
  console.log(`Preparing Return Time dataset from ${data.length} rows...`);

  const uniqueConditions = new Map<string, LabeledDataPoint>();

  for (const point of data) {
    const key = `${point.zone_id}_${point.boat_class}_${point.hour}_${point.wave_height.toFixed(1)}_${point.wind_speed.toFixed(0)}`;
    
    if (!uniqueConditions.has(key)) {
      uniqueConditions.set(key, point);
    }
  }

  const dataset: HFDatasetReturnTime[] = [];

  for (const [, point] of uniqueConditions) {
    dataset.push({
      zone_id: point.zone_id,
      boat_class: normalizeBoatClass(point.boat_class),
      month: point.month,
      departure_hour: point.hour,
      wave_height: Math.round(point.wave_height * 100) / 100,
      wind_speed: Math.round(point.wind_speed * 10) / 10,
      swell_height: Math.round(point.swell_height * 100) / 100,
      visibility: Math.round(point.visibility * 100) / 100,
      target_return_hours: point.target_return_hours,
    });
  }

  console.log(`Return Time: ${dataset.length} unique condition sets`);

  const avgHours = dataset.map(d => d.target_return_hours);
  console.log(`Average return: ${(avgHours.reduce((a, b) => a + b, 0) / avgHours.length).toFixed(1)} hours`);

  return dataset;
}

export function saveDatasetToCSV<T extends Record<string, unknown>>(data: T[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      return typeof val === 'number' ? val : JSON.stringify(val);
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

async function main() {
  console.log('=== Preparing HF AutoTrain Datasets ===\n');

  const fs = require('fs');
  const path = require('path');

  const inputPath = path.join(__dirname, '..', 'data', 'labeled_data.csv');
  console.log(`Loading from: ${inputPath}`);

  if (!fs.existsSync(inputPath)) {
    console.error('Error: labeled_data.csv not found!');
    console.error('Please run fetch_historical_data.ts and generate_labels.ts first');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');

  const data: LabeledDataPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 15) continue;

    data.push({
      zone_id: values[0],
      boat_class: values[1] as 'A' | 'B' | 'C',
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
      target_day_safe: parseInt(values[13]),
      target_hourly_risk: parseInt(values[14]),
      target_return_hours: parseInt(values[15]),
    });
  }

  console.log(`Loaded ${data.length} labeled data points\n`);

  const daySafetyData = prepareDaySafetyDataset(data);
  const daySafetyCSV = saveDatasetToCSV(daySafetyData);
  fs.writeFileSync(
    path.join(__dirname, '..', 'data', 'hf_day_safety.csv'),
    daySafetyCSV
  );
  console.log('Saved: hf_day_safety.csv\n');

  const hourlyRiskData = prepareHourlyRiskDataset(data);
  const hourlyRiskCSV = saveDatasetToCSV(hourlyRiskData);
  fs.writeFileSync(
    path.join(__dirname, '..', 'data', 'hf_hourly_risk.csv'),
    hourlyRiskCSV
  );
  console.log('Saved: hf_hourly_risk.csv\n');

  const returnTimeData = prepareReturnTimeDataset(data);
  const returnTimeCSV = saveDatasetToCSV(returnTimeData);
  fs.writeFileSync(
    path.join(__dirname, '..', 'data', 'hf_return_time.csv'),
    returnTimeCSV
  );
  console.log('Saved: hf_return_time.csv\n');

  console.log('=== Dataset Preparation Complete ===');
  console.log('Ready for HuggingFace AutoTrain upload');
}

if (require.main === module) {
  main().catch(console.error);
}