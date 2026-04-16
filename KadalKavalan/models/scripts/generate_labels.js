const fs = require('fs');
const path = require('path');

const BOAT_LIMITS = {
  A: { wave: 1.0, wind: 28, gust: 35, vis: 3 },
  B: { wave: 2.0, wind: 40, gust: 50, vis: 2 },
  C: { wave: 3.5, wind: 55, gust: 65, vis: 1 },
};

function calculateRiskScore(row) {
  const limits = BOAT_LIMITS[row.boat_class];
  const wave = parseFloat(row.wave_height);
  const wind = parseFloat(row.wind_speed);
  const gust = parseFloat(row.wind_gust);
  const vis = parseFloat(row.visibility);

  if (!limits || !wave) return 50;

  const waveRatio = wave / limits.wave;
  const windRatio = Math.max(wind, gust * 0.8) / limits.wind;
  const visRatio = vis / limits.vis;

  const waveScore = Math.min(100, waveRatio * 80);
  const windScore = Math.min(100, windRatio * 80);
  const visScore = visRatio >= 1 ? 0 : (visRatio >= 0.5 ? 30 : 70);

  return waveScore * 0.4 + windScore * 0.4 + visScore * 0.2;
}

function calculateReturnTime(row) {
  const limits = BOAT_LIMITS[row.boat_class];
  const wave = parseFloat(row.wave_height);
  const wind = parseFloat(row.wind_speed);

  if (!limits || !wave) return 6;

  const base = 6;
  const waveDelay = Math.max(0, (wave - limits.wave * 0.5)) * 2;
  const windDelay = Math.max(0, (wind - limits.wind * 0.5)) * 0.1;

  return Math.min(12, Math.max(2, Math.round(base + waveDelay + windDelay)));
}

function main() {
  console.log("=== Generating Labels ===\n");

  const dataPath = path.join(__dirname, '..', 'data', 'historical_data.csv');
  const outputPath = path.join(__dirname, '..', 'data', 'labeled_data.csv');

  if (!fs.existsSync(dataPath)) {
    console.error('Error: historical_data.csv not found!');
    process.exit(1);
  }

  const csv = fs.readFileSync(dataPath, 'utf-8').split('\n');
  const headers = csv[0] + ',risk_score,target_day_safe,target_hourly_risk,target_return_hours';
  const rows = [headers];

  let safeCount = 0;
  let totalCount = 0;

  for (let i = 1; i < csv.length; i++) {
    if (!csv[i].trim()) continue;
    
    const cols = csv[i].split(',');
    const row = {
      zone_id: cols[0],
      boat_class: cols[1],
      wave_height: cols[6],
      wind_speed: cols[7],
      wind_gust: cols[8],
      visibility: cols[10],
    };

    const riskScore = calculateRiskScore(row);
    const daySafe = riskScore < 30 ? 1 : 0;
    const returnTime = calculateReturnTime(row);

    rows.push(`${csv[i]},${riskScore.toFixed(1)},${daySafe},${Math.round(riskScore)},${returnTime}`);

    if (daySafe === 1) safeCount++;
    totalCount++;
  }

  fs.writeFileSync(outputPath, rows.join('\n'));

  console.log(`Processed: ${totalCount} rows`);
  console.log(`SAFE: ${safeCount}, UNSAFE: ${totalCount - safeCount}`);
  console.log(`Saved to: ${outputPath}`);
}

main();