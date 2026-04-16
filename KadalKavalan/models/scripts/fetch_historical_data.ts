import { fishingZones, Zone, BoatClass } from '../../src/data/zones';

const OPEN_METEO_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';

export interface HistoricalDataPoint {
  zone_id: string;
  boat_class: BoatClass;
  timestamp: string;
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
}

const BOAT_CLASSES: BoatClass[] = ['A', 'B', 'C'];

function getTideState(hour: number, day: number): string {
  const hourInDay = (day - 1) * 24 + hour;
  const tideCycle = 24.84;
  const position = hourInDay % tideCycle;

  if (position < 6) return 'rising';
  if (position < 12) return 'high';
  if (position < 18) return 'falling';
  if (position < 24) return 'low';
  return 'rising';
}

async function fetchHistoricalDataForZone(
  zone: Zone,
  startDate: string,
  endDate: string,
  boatClass: BoatClass
): Promise<HistoricalDataPoint[]> {
  const { centroid_lat, centroid_lon, id } = zone;
  console.log(`Fetching ${id} (${boatClass}) from ${startDate} to ${endDate}...`);

  const url = `${OPEN_METEO_ARCHIVE}?latitude=${centroid_lat}&longitude=${centroid_lon}&start_date=${startDate}&end_date=${endDate}&hourly=wave_height,swell_height,wave_period,wind_speed_10m,wind_gusts_10m,visibility,weather_code&timezone=auto`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.hourly) {
      console.error(`No data for ${id}`);
      return [];
    }

    const hourly = data.hourly;
    const timestamps = hourly.time || [];
    const results: HistoricalDataPoint[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const date = new Date(timestamp);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();

      results.push({
        zone_id: id,
        boat_class: boatClass,
        timestamp,
        month,
        day,
        hour,
        wave_height: hourly.wave_height?.[i] ?? 0,
        wind_speed: hourly.wind_speed_10m?.[i] ?? 0,
        wind_gust: hourly.wind_gusts_10m?.[i] ?? 0,
        swell_height: hourly.swell_height?.[i] ?? 0,
        visibility: (hourly.visibility?.[i] ?? 10000) / 1000,
        weather_code: hourly.weather_code?.[i] ?? 0,
        tide_state: getTideState(hour, day),
      });
    }

    console.log(`Got ${results.length} rows for ${id} (${boatClass})`);
    return results;
  } catch (error) {
    console.error(`Error fetching ${id}:`, error);
    return [];
  }
}

export async function fetchAllHistoricalData(): Promise<HistoricalDataPoint[]> {
  const allData: HistoricalDataPoint[] = [];
  const startDate = '2023-01-01';
  const endDate = '2024-12-31';

  console.log('Starting historical data collection...');
  console.log(`Period: ${startDate} to ${endDate}`);
  console.log(`Zones: ${fishingZones.length}`);
  console.log(`Boat classes: ${BOAT_CLASSES.length}`);

  for (const zone of fishingZones) {
    for (const boatClass of BOAT_CLASSES) {
      const zoneData = await fetchHistoricalDataForZone(zone, startDate, endDate, boatClass);
      allData.push(...zoneData);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Total data points: ${allData.length}`);
  return allData;
}

export function saveToCSV(data: HistoricalDataPoint[], filename: string): string {
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
  ].join(','));

  return [headers, ...rows].join('\n');
}

async function main() {
  console.log('=== Historical Data Collection ===');
  console.log('Fetching 2 years of marine weather data');
  console.log('From: Open-Meteo Historical Archive API\n');

  const data = await fetchAllHistoricalData();

  if (data.length > 0) {
    const csv = saveToCSV(data, 'historical_data_2023_2024.csv');
    console.log('\nData sample (first 5 rows):');
    console.log(csv.split('\n').slice(0, 6).join('\n'));
    console.log(`\n... and ${data.length - 5} more rows`);

    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '..', 'data', 'historical_data.csv');
    fs.writeFileSync(outputPath, csv);
    console.log(`\nSaved to: ${outputPath}`);
  } else {
    console.log('No data collected!');
  }
}

if (require.main === module) {
  main().catch(console.error);
}