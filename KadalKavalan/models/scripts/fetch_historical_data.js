const zones = [
  { id: 'TN-01', lat: 9.2876, lon: 79.3129 },
  { id: 'TN-02', lat: 9.0, lon: 78.5 },
  { id: 'TN-03', lat: 10.5, lon: 79.8 },
  { id: 'TN-04', lat: 12.9, lon: 80.2 },
  { id: 'KL-01', lat: 8.3, lon: 76.9 },
  { id: 'KL-02', lat: 9.9, lon: 76.2 },
  { id: 'KL-03', lat: 11.2, lon: 75.7 },
  { id: 'AP-01', lat: 16.5, lon: 81.5 },
  { id: 'AP-02', lat: 17.7, lon: 83.3 },
  { id: 'OD-01', lat: 19.2, lon: 84.8 },
  { id: 'OD-02', lat: 20.3, lon: 86.6 },
];

const boatClasses = ['A', 'B', 'C'];

function getTideState(hour, day) {
  const hourInDay = (day - 1) * 24 + hour;
  const position = hourInDay % 24.84;
  if (position < 6) return 'rising';
  if (position < 12) return 'high';
  if (position < 18) return 'falling';
  return 'low';
}

function generateData() {
  console.log("=== Generating Historical Data ===");
  console.log("Creating 2 years of simulated marine weather data\n");

  const allData = [];
  let rowCount = 0;

  for (const z of zones) {
    for (const bc of boatClasses) {
      for (let day = 1; day <= 365; day++) {
        const month = Math.floor((day - 1) / 30) + 1;
        
        let baseWave, baseWind;
        if (month >= 6 && month <= 9) {
          baseWave = 0.8 + Math.random() * 1.5;
          baseWind = 15 + Math.random() * 25;
        } else if (month >= 10 && month <= 11) {
          baseWave = 0.5 + Math.random() * 0.8;
          baseWind = 10 + Math.random() * 15;
        } else if (month === 12 || month <= 2) {
          baseWave = 0.3 + Math.random() * 0.5;
          baseWind = 8 + Math.random() * 12;
        } else {
          baseWave = 0.4 + Math.random() * 0.7;
          baseWind = 10 + Math.random() * 15;
        }

        for (let hour = 0; hour < 24; hour++) {
          const waveHeight = Math.max(0, baseWave + (Math.random() - 0.5) * 0.3);
          const swellHeight = waveHeight * (0.5 + Math.random() * 0.4);
          const windSpeed = Math.max(0, baseWind + (Math.random() - 0.5) * 5);
          const windGust = windSpeed * (1 + Math.random() * 0.3);
          const visibility = 8 + Math.random() * 4;
          const weatherCode = Math.random() > 0.95 ? Math.floor(Math.random() * 3) + 61 : 0;

          const date = new Date(2023, 0, day);
          date.setHours(hour);

          allData.push({
            zone_id: z.id,
            boat_class: bc,
            timestamp: date.toISOString(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: hour,
            wave_height: waveHeight.toFixed(2),
            wind_speed: windSpeed.toFixed(1),
            wind_gust: windGust.toFixed(1),
            swell_height: swellHeight.toFixed(2),
            visibility: Math.min(15, visibility).toFixed(2),
            weather_code: weatherCode,
            tide_state: getTideState(hour, day),
          });
          rowCount++;
        }
      }
      console.log(`Generated ${z.id} (${bc}): ${rowCount} rows`);
    }
  }

  console.log(`\nTotal: ${allData.length} data points`);
  return allData;
}

async function main() {
  const data = generateData();

  const headers = 'zone_id,boat_class,timestamp,month,day,hour,wave_height,wind_speed,wind_gust,swell_height,visibility,weather_code,tide_state';
  const rows = data.map(r => [
    r.zone_id, r.boat_class, r.timestamp, r.month, r.day, r.hour,
    r.wave_height, r.wind_speed, r.wind_gust, r.swell_height,
    r.visibility, r.weather_code, r.tide_state
  ].join(','));

  const csv = [headers, ...rows].join('\n');

  const fs = require('fs');
  const path = require('path');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  const outputPath = path.join(dataDir, 'historical_data.csv');
  fs.writeFileSync(outputPath, csv);
  console.log(`\nSaved to: ${outputPath}`);
}

main();