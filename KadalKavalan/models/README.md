# Kadal Kavalan - ML Models (XGBoost + FastAPI)

## Overview

This module provides ML-powered predictions using **XGBoost + FastAPI** (no HuggingFace required).

## Architecture

```
React Native App ──────► FastAPI Backend ◄─────► XGBoost Models
                           │
                    http://localhost:8000
                         (or deployed URL)
```

## Quick Start

### Option A: Local Backend (Recommended for Development)

1. **Install dependencies:**
```bash
pip install -r backend/requirements.txt
```

2. **Start backend:**
```bash
uvicorn backend/main:app --reload --port 8000
```
Or double-click `start_backend.bat`

3. **Test API:**
```
http://localhost:8000/docs
```

### Option B: Train Models First

1. **Train XGBoost models:**
```bash
pip install xgboost
python scripts/train_xgboost.py
```

2. **Models saved to:** `backend/`

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict/day-safety` | POST | SAFE/UNSAFE probability |
| `/predict/hourly-risk` | POST | 24-hour risk profile |
| `/predict/return-time` | POST | Estimated return hours |
| `/predict/all` | POST | All predictions |
| `/health` | GET | Server health |

## Example Request

```bash
curl -X POST http://localhost:8000/predict/day-safety \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": "TN-01",
    "boat_class": "A",
    "month": 4,
    "day": 16,
    "hour": 6,
    "wave_height": 0.8,
    "wind_speed": 15,
    "wind_gust": 20,
    "swell_height": 0.5,
    "visibility": 10,
    "weather_code": 0,
    "tide_state": "rising"
  }'
```

## Example Response

```json
{
  "probability_safe": 0.75,
  "risk_factors": [],
  "model_used": "xgboost"
}
```

---

## Directory Structure

```
models/
├── README.md                    # This file
├── IMPLEMENTATION_PLAN.md        # Technical plan
├── scripts/
│   ├── train_xgboost.py       # Training script
│   ├── train_colab.py        # Colab alternative
│   └── fetch_historical_data.js
├── backend/
│   ├── main.py              # FastAPI server
│   ├── requirements.txt     # Python dependencies
│   ├── day_safety.json     # Trained model
│   ├── hourly_risk.json    # Trained model
│   ├── return_time.json    # Trained model
│   └── config.json       # Model config
├── start_backend.bat        # Windows shortcut
└── src/
    └── services/
        └── mlRiskScorer.ts  # App integration
```

## Running Without Trained Models

The backend works **without trained models** - it uses heuristic-based simulation as fallback:

```json
{
  "probability_safe": 0.65,
  "risk_factors": ["High waves (1.2m)"],
  "model_used": "fallback_simulation"
}
```

## Training (Optional)

```bash
# Install XGBoost
pip install xgboost

# Train models
python scripts/train_xgboost.py
```

Output:
```
=== Training Day Safety Model ===
Accuracy: 0.852, F1: 0.849

=== Training Hourly Risk Model ===
RMSE: 12.3, R2: 0.78

=== Training Return Time Model ===
RMSE: 1.8 hours, R2: 0.65

Models saved to: backend/
```

## React Native Integration

Update `models/src/services/hfInference.ts` to point to your backend:

```typescript
// Change this line:
const HF_INFERENCE_URL = 'http://localhost:8000';

// Or deployed URL:
const HF_INFERENCE_URL = 'https://your-server.onrender.com';
```

## Troubleshooting

### "No module named 'xgboost'"
```bash
pip install xgboost
```

### "Model not found"
Models will be created when you run `train_xgboost.py`. Until then, simulation mode is used.

### "Connection refused"
Make sure backend is running: `uvicorn backend/main:app --port 8000`

---

## Files Summary

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server |
| `backend/requirements.txt` | Python deps |
| `scripts/train_xgboost.py` | Model trainer |
| `start_backend.bat` | Quick start |