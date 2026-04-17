# SeaGuard ML Predictions Implementation Plan

## Project Overview

Add HuggingFace ML predictions to augment existing risk scoring in the SeaGuard fishermen safety app.

**Data Source**: Open-Meteo Historical API (free, no registration)
**Training Data**: 2 years (2023-2024)
**Models**: 3 models trained on HF AutoTrain (free tier)

---

## Phase 1: Data Collection

### API: Open-Meteo Historical Archive API

**Endpoint**: `https://archive-api.open-meteo.com/v1/archive`

**Parameters Available**:
- `wave_height` - Significant wave height (m)
- `swell_height` - Swell wave height (m)
- `wave_period` - Wave period (s)
- `wind_speed_10m` - Wind speed (km/h)
- `wind_gusts_10m` - Wind gusts (km/h)
- `visibility` - Visibility (m)
- `weather_code` - WMO weather code

**Zones Coverage** (11 fishing zones):
| Zone ID | Lat | Lon | State |
|--------|-----|-----|-------|
| TN-01 | 9.2876 | 79.3129 | Tamil Nadu |
| TN-02 | 9.0 | 78.5 | Tamil Nadu |
| TN-03 | 10.5 | 79.8 | Tamil Nadu |
| TN-04 | 12.9 | 80.2 | Tamil Nadu |
| KL-01 | 8.3 | 76.9 | Kerala |
| KL-02 | 9.9 | 76.2 | Kerala |
| KL-03 | 11.2 | 75.7 | Kerala |
| AP-01 | 16.5 | 81.5 | Andhra Pradesh |
| AP-02 | 17.7 | 83.3 | Andhra Pradesh |
| OD-01 | 19.2 | 84.8 | Odisha |
| OD-02 | 20.3 | 86.6 | Odisha |

---

## Phase 2: Data Collection Script

**File**: `scripts/fetch_historical_data.ts`

```typescript
// Fetches 2 years (2023-2024) of historical marine weather data
// API: https://archive-api.open-meteo.com/v1/archive
// Zones: 11 fishing zones
// Output: historical_data_2023_2024.csv (~290,000 rows)
```

---

## Phase 3: Label Generation

**File**: `scripts/generate_labels.ts`

Using existing risk scorer to auto-label historical data:

```typescript
// For each row:
// 1. Apply existing riskScorer.ts logic
// 2. Generate target labels:
target_day_safe: 1 if score < 30 else 0
target_hourly_risk: risk score for each hour (0-100)
target_return_hours: estimated based on conditions
```

---

## Phase 4: HF AutoTrain Model Training

### Model 1: Day Safety Predictor
- **Task**: Binary Classification
- **Input**: zone_id, boat_class, month, day, hour, wave_height, wind_speed, wind_gust, swell_height, visibility, weather_code
- **Output**: `probability_safe` (0-1)
- **Accuracy Target**: >80%

### Model 2: Hourly Risk Predictor
- **Task**: Multi-output Regression (24 outputs)
- **Input**: Hourly forecast for 24 hours
- **Output**: `risk_0` to `risk_23` (risk score for each hour)
- **Accuracy Target**: RMSE < 15

### Model 3: Return Time Estimator
- **Task**: Regression
- **Input**: conditions + boat_class + departure_time
- **Output**: `estimated_hours` (1-12)
- **Accuracy Target**: ±2 hours

---

## Phase 5: App Integration

### Files Modified

1. `src/api/types.ts` - Add ML prediction types
2. `src/services/hfInference.ts` - New service for HF API calls
3. `src/services/riskScorer.ts` - Blend ML + existing scoring
4. `src/context/WeatherContext.tsx` - 15-min refresh logic
5. `src/screens/MainDashboard.tsx` - Display ML confidence

### Blending Formula

```typescript
final_risk_score = (ml_prediction × 0.30) +
                  (current_conditions × 0.30) +
                  (forecast_baseline × 0.40)
```

---

## Training Order

| # | Model | Task | Status |
|---|-------|------|--------|
| 1 | Day Safety | Binary Classification | Priority |
| 2 | Hourly Risk | Multi-output Regression | Second |
| 3 | Return Time | Regression | Third |

---

## HF Free Tier Limits (Prototype)

| Resource | Limit | Usage |
|----------|-------|-------|
| AutoTrain | 1 hour compute/month | Enough for demo |
| Storage | 10GB | Holds 3 years data |
| Inference API | ~500 calls/month | 1-day show: ~50 calls |

---

## Timeline

| Day | Task |
|-----|------|
| 1 | Data collection script runs |
| 2 | Label generation |
| 3 | HF AutoTrain model 1 (Day Safety) |
| 4 | HF AutoTrain model 2 (Hourly Risk) |
| 5 | HF AutoTrain model 3 (Return Time) |
| 6 | App integration |
| 7 | Testing & Demo |

---

## Required Files

```
models/
├── scripts/
│   ├── fetch_historical_data.ts    # Data collection
│   ├── generate_labels.ts        # Label generation
│   └── prepare_hf_dataset.ts     # HF format conversion
├── data/
│   ├── historical_data.csv       # Raw data
│   ├── labeled_data.csv         # With labels
│   └── hf_dataset/              # HF AutoTrain format
├── notebooks/
│   └── train_model.ipynb        # Jupyter notebooks (optional)
├── src/
│   ├── services/
│   │   └── hfInference.ts      # HF API service
│   └── types/
│       └── mlTypes.ts         # ML prediction types
└── README.md                  # This file
```