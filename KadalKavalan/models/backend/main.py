"""
Kadal Kavalan - FastAPI Backend
ML Inference Server for React Native App

Usage:
    pip install -r requirements.txt
    uvicorn main:app --reload

Endpoints:
    POST /predict/day-safety
    POST /predict/hourly-risk
    POST /predict/return-time
    GET /logs
"""

import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import numpy as np
from datetime import datetime

# Setup CORS for React Native app
app = FastAPI(title="Kadal Kavalan ML API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    body_text = "<unavailable>"
    try:
        body_bytes = await request.body()
        if body_bytes:
            body_text = body_bytes.decode("utf-8", errors="replace")
    except Exception:
        pass

    print(f"[VALIDATION_ERROR] {request.method} {request.url.path}")
    print(f"    Errors: {exc.errors()}")
    print(f"    Body: {body_text}")

    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

print("="*50)
print("Kadal Kavalan ML Backend")
print("="*50)

# ============================================================================
# CONFIGURATION
# ============================================================================

MODEL_DIR = os.path.dirname(__file__)

# Prefer XGBoost if available; fallback to sklearn/joblib mode otherwise.
USE_XGB = False
try:
    import xgboost as xgb
    USE_XGB = True
    print("[OK] XGBoost available")
except Exception as e:
    print(f"[WARN] XGBoost unavailable, falling back to sklearn mode: {e}")

request_logs = []


def log_request(endpoint: str, request_body: dict, response_body: dict):
    timestamp = datetime.utcnow().isoformat()
    entry = {
        "timestamp": timestamp,
        "endpoint": endpoint,
        "request": request_body,
        "response": response_body,
    }

    request_logs.append(entry)
    if len(request_logs) > 500:
        del request_logs[:-500]

    print(f"[IN] {endpoint} called at {timestamp}")
    print(f"     Input: {request_body}")
    print(f"     Output: {response_body}")

ZONES = [
    {'id': 'TN-01', 'lat': 9.2876, 'lon': 79.3129},
    {'id': 'TN-02', 'lat': 9.0, 'lon': 78.5},
    {'id': 'TN-03', 'lat': 10.5, 'lon': 79.8},
    {'id': 'TN-04', 'lat': 12.9, 'lon': 80.2},
    {'id': 'KL-01', 'lat': 8.3, 'lon': 76.9},
    {'id': 'KL-02', 'lat': 9.9, 'lon': 76.2},
    {'id': 'KL-03', 'lat': 11.2, 'lon': 75.7},
    {'id': 'AP-01', 'lat': 16.5, 'lon': 81.5},
    {'id': 'AP-02', 'lat': 17.7, 'lon': 83.3},
    {'id': 'OD-01', 'lat': 19.2, 'lon': 84.8},
    {'id': 'OD-02', 'lat': 20.3, 'lon': 86.6},
]

FEATURE_COLS = [
    'zone_encoded', 'boat_encoded', 'month', 'day', 'hour',
    'wave_height', 'wind_speed', 'wind_gust', 'swell_height',
    'visibility', 'weather_code', 'tide_encoded'
]

# ============================================================================
# REQUEST MODELS
# ============================================================================

class DaySafetyRequest(BaseModel):
    zone_id: str
    boat_class: str
    month: int
    day: int
    hour: int
    wave_height: float
    wind_speed: float
    wind_gust: float
    swell_height: float
    visibility: float
    weather_code: int
    tide_state: str

class HourlyRiskRequest(BaseModel):
    zone_id: str
    boat_class: str
    month: int
    day: int
    hour: int
    wave_height: float
    wind_speed: float
    wind_gust: float
    swell_height: float
    visibility: float
    weather_code: int
    tide_state: str

class ReturnTimeRequest(BaseModel):
    zone_id: str
    boat_class: str
    month: int
    day: int
    hour: int
    wave_height: float
    wind_speed: float
    wind_gust: float
    swell_height: float
    visibility: float
    weather_code: int
    tide_state: str

# ============================================================================
# LOAD MODELS
# ============================================================================

print("Loading models...")

models = {}

def load_model(name, model_path):
    """Load XGBoost or sklearn model"""
    if not os.path.exists(model_path):
        print(f"[WARN] Model not found: {model_path}")
        return None
    
    try:
        if USE_XGB:
            # day_safety is a classifier, others are regressors
            if name == 'day_safety':
                model = xgb.XGBClassifier()
            else:
                model = xgb.XGBRegressor()
            model.load_model(model_path)
            print(f"[OK] Loaded {name}")
            return model
        else:
            import joblib
            model = joblib.load(model_path)
            print(f"[OK] Loaded {name}")
            return model
    except Exception as e:
        print(f"[ERROR] Loading {name}: {e}")
        return None

# Try to load models
day_safety_path = os.path.join(MODEL_DIR, 'day_safety.json')
hourly_risk_path = os.path.join(MODEL_DIR, 'hourly_risk.json')
return_time_path = os.path.join(MODEL_DIR, 'return_time.json')

print("\nLoading models...")
models['day_safety'] = load_model('day_safety', day_safety_path)
models['hourly_risk'] = load_model('hourly_risk', hourly_risk_path)
models['return_time'] = load_model('return_time', return_time_path)

all_loaded = all(models.values())
print(f"\n[*] Models ready: {all_loaded}")
if not all_loaded:
    print("[WARN] Running in SIMULATION mode (no real models)")
print("="*50 + "\n")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def encode_zone(zone_id: str) -> int:
    """Encode zone ID to integer"""
    zone_map = {z['id']: i for i, z in enumerate(ZONES)}
    return zone_map.get(zone_id, 0)

def encode_boat(boat_class: str) -> int:
    """Encode boat class to integer"""
    normalized = (boat_class or '').strip().upper()
    return {'A': 0, 'B': 1, 'C': 2}.get(normalized, 0)

def encode_tide(tide_state: str) -> int:
    """Encode tide state to integer"""
    normalized = (tide_state or '').strip().lower()
    return {'rising': 0, 'high': 1, 'falling': 2, 'low': 3}.get(normalized, 0)

def prepare_features(req) -> list:
    """Convert request to feature array"""
    return [
        encode_zone(req.zone_id),
        encode_boat(req.boat_class),
        req.month,
        req.day,
        req.hour,
        req.wave_height,
        req.wind_speed,
        req.wind_gust,
        req.swell_height,
        req.visibility,
        req.weather_code,
        encode_tide(req.tide_state),
    ]

def simulate_prediction(features: list, model_type: str) -> float:
    """Fallback simulation when model not loaded"""
    # Simple heuristic-based prediction
    wave_score = min(100, features[5] * 40)
    wind_score = min(100, features[6] * 2)
    tide_score = features[11] * 10
    
    if model_type == 'day_safety':
        risk = (wave_score + wind_score + tide_score) / 3
        return 1 if risk < 40 else 0
    elif model_type == 'hourly_risk':
        return (wave_score + wind_score) * 0.8
    else:  # return_time
        return 6 + (features[5] * 2) + (features[6] * 0.1)

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {"message": "Kadal Kavalan ML API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models_loaded": {
            "day_safety": models['day_safety'] is not None,
            "hourly_risk": models['hourly_risk'] is not None,
            "return_time": models['return_time'] is not None,
        },
        "xgboost": USE_XGB
    }

@app.post("/predict/day-safety")
async def predict_day_safety(req: DaySafetyRequest):
    """Predict if day is safe for fishing"""
    try:
        features = prepare_features(req)
        features = np.array([features])
        
        if models['day_safety'] is not None:
            prediction = models['day_safety'].predict(features)[0]
            probability = float(prediction)
        else:
            probability = simulate_prediction(features[0].tolist(), 'day_safety')
        
        result = {
            "probability_safe": probability,
            "risk_factors": get_risk_factors(req),
            "model_used": "xgboost" if USE_XGB else "sklearn"
        }
        log_request("/predict/day-safety", req.model_dump(), result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/hourly-risk")
async def predict_hourly_risk(req: HourlyRiskRequest):
    """Predict hourly risk scores"""
    try:
        features = prepare_features(req)
        features = np.array([features])
        
        if models['hourly_risk'] is not None:
            prediction = models['hourly_risk'].predict(features)[0]
        else:
            prediction = simulate_prediction(features[0].tolist(), 'hourly_risk')
        
        # Generate 24-hour risk profile
        hourly_risk = []
        for hour in range(24):
            hour_features = features.copy()
            hour_features[0, 4] = hour  # Change hour
            if models['hourly_risk'] is not None:
                hrisk = models['hourly_risk'].predict(hour_features)[0]
            else:
                hrisk = simulate_prediction(hour_features[0].tolist(), 'hourly_risk')
            hourly_risk.append(int(min(100, max(0, hrisk))))
        
        # Find safe window
        safe_indices = [i for i, r in enumerate(hourly_risk) if r < 35]
        safe_window = None
        if safe_indices:
            safe_window = {"start": safe_indices[0], "end": safe_indices[-1]}
        
        result = {
            "risk_score": int(prediction),
            "hourly_risk": hourly_risk,
            "safe_window": safe_window,
            "model_used": "xgboost" if USE_XGB else "sklearn"
        }
        log_request("/predict/hourly-risk", req.model_dump(), result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/return-time")
async def predict_return_time(req: ReturnTimeRequest):
    """Predict return time in hours"""
    try:
        features = prepare_features(req)
        features = np.array([features])
        
        if models['return_time'] is not None:
            prediction = models['return_time'].predict(features)[0]
        else:
            prediction = simulate_prediction(features[0].tolist(), 'return_time')
        
        hours = round(min(12, max(2, prediction)))
        
        result = {
            "estimated_hours": hours,
            "confidence": 0.75,
            "optimal_departure": get_optimal_departure(req),
            "model_used": "xgboost" if USE_XGB else "sklearn"
        }
        log_request("/predict/return-time", req.model_dump(), result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# HELPER ENDPOINTS
# ============================================================================

def get_risk_factors(req) -> List[str]:
    """Get list of risk factors"""
    factors = []
    if req.wave_height > 1.0:
        factors.append(f"High waves ({req.wave_height}m)")
    if req.wind_speed > 25:
        factors.append(f"Strong winds ({req.wind_speed}km/h)")
    if req.swell_height > 0.8:
        factors.append(f"Large swell ({req.swell_height}m)")
    if req.visibility < 5:
        factors.append(f"Poor visibility ({req.visibility}km)")
    return factors

def get_optimal_departure(req) -> int:
    """Calculate optimal departure time"""
    if req.wave_height < 0.8 and req.wind_speed < 15:
        return 6
    elif req.wave_height < 1.2 and req.wind_speed < 20:
        return 7
    return 8

@app.post("/predict/all")
async def predict_all(req: DaySafetyRequest):
    """Get all predictions at once"""
    try:
        day_safety = await predict_day_safety(req)
        hourly_risk = await predict_hourly_risk(req)
        return_time = await predict_return_time(req)
        
        return {
            "day_safety": day_safety,
            "hourly_risk": hourly_risk,
            "return_time": return_time,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs")
async def get_logs():
    """Get recent API request logs"""
    return {
        "logs": request_logs[-20:],
        "total": len(request_logs)
    }

@app.get("/stats")
async def get_stats():
    """Get API usage stats"""
    endpoint_counts = {}
    for log in request_logs:
        ep = log.get('endpoint', 'unknown')
        endpoint_counts[ep] = endpoint_counts.get(ep, 0) + 1
    return {
        "total_requests": len(request_logs),
        "by_endpoint": endpoint_counts,
        "models_loaded": {
            "day_safety": models['day_safety'] is not None,
            "hourly_risk": models['hourly_risk'] is not None,
            "return_time": models['return_time'] is not None,
        },
        "model_type": "xgboost" if USE_XGB else "sklearn"
    }

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)