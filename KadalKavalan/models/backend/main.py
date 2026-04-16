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
    POST /whatsapp/subscribe
    POST /whatsapp/unsubscribe
    POST /whatsapp/alert
    GET /whatsapp/status
    GET /logs
"""

import requests
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

from dotenv import load_dotenv
load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER')

OPEN_METEO_MARINE = 'https://marine-api.open-meteo.com/v1/marine'
OPEN_METEO_WEATHER = 'https://api.open-meteo.com/v1/forecast'

twilio_client = None
twilio_configured = False
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        from twilio.rest import Client
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        twilio_configured = True
        print("[OK] Twilio client initialized")
    except Exception as e:
        print(f"[WARN] Twilio not available: {e}")

print(f"[*] Twilio configured: {twilio_configured}, WhatsApp Number: {TWILIO_WHATSAPP_NUMBER}")

whatsapp_subscribers = {}

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

class WhatsAppSubscribeRequest(BaseModel):
    phone_number: str
    zone_id: str
    boat_class: str
    language: str = 'en'

class WhatsAppAlertRequest(BaseModel):
    phone_number: Optional[str] = None

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
    zone_map = {z['id']: i for i, z in enumerate(ZONES)}
    return zone_map.get(zone_id, 0)

def encode_boat(boat_class: str) -> int:
    normalized = (boat_class or '').strip().upper()
    return {'A': 0, 'B': 1, 'C': 2}.get(normalized, 0)

def encode_tide(tide_state: str) -> int:
    normalized = (tide_state or '').strip().lower()
    return {'rising': 0, 'high': 1, 'falling': 2, 'low': 3}.get(normalized, 0)

def prepare_features(req) -> list:
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
    wave_score = min(100, features[5] * 40)
    wind_score = min(100, features[6] * 2)
    tide_score = features[11] * 10
    
    if model_type == 'day_safety':
        risk = (wave_score + wind_score + tide_score) / 3
        return 1 if risk < 40 else 0
    elif model_type == 'hourly_risk':
        return (wave_score + wind_score) * 0.8
    else:
        return 6 + (features[5] * 2) + (features[6] * 0.1)

# ============================================================================
# WHATSAPP HELPERS
# ============================================================================

def format_whatsapp_message(zone_id: str, zone_name: str, risk_level: str, wave_height: float, wind_speed: float, safe_window: str) -> str:
    return (
        f"🌊 KADAL KAVALAN\n"
        f"📍 {zone_name}\n"
        f"⚠️ Risk: {risk_level}\n"
        f"🌊 Wave: {wave_height:.1f}m\n"
        f"💨 Wind: {wind_speed:.0f} km/h\n"
        f"⏰ Safe Window: {safe_window}"
    )

def send_whatsapp_message(phone_number: str, message: str) -> bool:
    """Send WhatsApp message via Twilio"""
    if not twilio_configured or not TWILIO_WHATSAPP_NUMBER:
        print(f"[WARN] Twilio not configured, skipping message to {phone_number}")
        return False
    try:
        twilio_client.messages.create(
            from_=f"whatsapp:{TWILIO_WHATSAPP_NUMBER}",
            body=message,
            to=f"whatsapp:{phone_number}"
        )
        print(f"[OK] WhatsApp message sent to {phone_number}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send WhatsApp: {e}")
        return False

async def fetch_zone_weather(zone: dict) -> dict:
    """Fetch current weather for a zone from Open-Meteo"""
    lat = zone['lat']
    lon = zone['lon']
    
    marine_url = f"{OPEN_METEO_MARINE}?latitude={lat}&longitude={lon}&current=wave_height,wave_direction,swell_wave_height&timezone=auto"
    weather_url = f"{OPEN_METEO_WEATHER}?latitude={lat}&longitude={lon}&current=wind_speed_10m,wind_direction_10m,windgusts_10m,visibility,weather_code&timezone=auto"
    
    try:
        marine_res = await requests.get(marine_url, timeout=10)
        weather_res = await requests.get(weather_url, timeout=10)
        
        marine_data = marine_res.json() if marine_res.status_code == 200 else {}
        weather_data = weather_res.json() if weather_res.status_code == 200 else {}
        
        current = marine_data.get('current', {})
        current_weather = weather_data.get('current', {})
        
        return {
            'wave_height': current.get('wave_height', 0) or 0,
            'wave_direction': current.get('wave_direction', 0) or 0,
            'swell_height': current.get('swell_wave_height', 0) or 0,
            'wind_speed': current_weather.get('wind_speed_10m', 0) or 0,
            'wind_gust': current_weather.get('windgusts_10m', 0) or 0,
            'visibility': current_weather.get('visibility', 10000) or 10000,
            'weather_code': current_weather.get('weather_code', 0),
        }
    except Exception as e:
        print(f"[ERROR] Fetch weather failed: {e}")
        return {'wave_height': 0, 'wind_speed': 0, 'safe_window': 'N/A'}

def calculate_risk(weather: dict, boat_class: str) -> str:
    """Calculate risk level based on conditions and boat class"""
    wave = weather.get('wave_height', 0)
    wind = weather.get('wind_speed', 0)
    
    thresholds = {
        'A': {'max_wave': 1.0, 'max_wind': 28},
        'B': {'max_wave': 2.0, 'max_wind': 40},
        'C': {'max_wave': 3.5, 'max_wind': 55},
    }
    
    t = thresholds.get(boat_class, thresholds['A'])
    
    if wave > t['max_wave'] * 1.5 or wind > t['max_wind'] * 1.5:
        return "DANGER"
    elif wave > t['max_wave'] or wind > t['max_wind']:
        return "ADVISORY"
    else:
        return "SAFE"

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
        "xgboost": USE_XGB,
        "whatsapp_configured": twilio_configured
    }

@app.post("/predict/day-safety")
async def predict_day_safety(req: DaySafetyRequest):
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
    try:
        features = prepare_features(req)
        features = np.array([features])
        
        if models['hourly_risk'] is not None:
            prediction = models['hourly_risk'].predict(features)[0]
        else:
            prediction = simulate_prediction(features[0].tolist(), 'hourly_risk')
        
        hourly_risk = []
        for hour in range(24):
            hour_features = features.copy()
            hour_features[0, 4] = hour
            if models['hourly_risk'] is not None:
                hrisk = models['hourly_risk'].predict(hour_features)[0]
            else:
                hrisk = simulate_prediction(hour_features[0].tolist(), 'hourly_risk')
            hourly_risk.append(int(min(100, max(0, hrisk))))
        
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
    if req.wave_height < 0.8 and req.wind_speed < 15:
        return 6
    elif req.wave_height < 1.2 and req.wind_speed < 20:
        return 7
    return 8

@app.post("/predict/all")
async def predict_all(req: DaySafetyRequest):
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

# ============================================================================
# WHATSAPP ENDPOINTS
# ============================================================================

@app.post("/whatsapp/subscribe")
async def whatsapp_subscribe(req: WhatsAppSubscribeRequest):
    """Subscribe to WhatsApp alerts"""
    phone = req.phone_number
    if not phone.startswith('+'):
        phone = f"+{phone}"
    
    whatsapp_subscribers[phone] = {
        "zone_id": req.zone_id,
        "boat_class": req.boat_class,
        "language": req.language,
        "subscribed_at": datetime.utcnow().isoformat()
    }
    
    confirmation_msg = format_whatsapp_message(
        req.zone_id,
        f"Zone {req.zone_id}",
        "CONFIRMED",
        0.0,
        0.0,
        "Subscribed!"
    )
    send_whatsapp_message(phone, f"✅ Subscribed to Kadal Kavalan alerts!\n\n{confirmation_msg}")
    
    return {"status": "subscribed", "phone": phone}

@app.post("/whatsapp/unsubscribe")
async def whatsapp_unsubscribe(req: WhatsAppAlertRequest):
    """Unsubscribe from WhatsApp alerts"""
    phone = req.phone_number
    if not phone.startswith('+'):
        phone = f"+{phone}"
    
    if phone in whatsapp_subscribers:
        del whatsapp_subscribers[phone]
        send_whatsapp_message(phone, "❌ Unsubscribed from Kadal Kavalan alerts.")
        return {"status": "unsubscribed", "phone": phone}
    return {"status": "not_found", "phone": phone}

@app.post("/whatsapp/alert")
async def whatsapp_alert(req: WhatsAppAlertRequest):
    """Trigger manual alert to all or specific user"""
    if not twilio_client:
        return {"error": "WhatsApp not configured"}
    
    target_phones = [req.phone_number] if req.phone_number else list(whatsapp_subscribers.keys())
    if not target_phones:
        return {"error": "No subscribers"}
    
    sent_count = 0
    for phone in target_phones:
        if phone not in whatsapp_subscribers:
            continue
        sub = whatsapp_subscribers[phone]
        zone_id = sub.get('zone_id', 'TN-01')
        zone = next((z for z in ZONES if z['id'] == zone_id), ZONES[0])
        
        weather_data = await fetch_zone_weather(zone)
        risk_level = calculate_risk(weather_data, sub.get('boat_class', 'A'))
        
        message = format_whatsapp_message(
            zone['id'],
            zone['id'],
            risk_level,
            weather_data.get('wave_height', 0),
            weather_data.get('wind_speed', 0),
            "Manual alert"
        )
        if send_whatsapp_message(phone, message):
            sent_count += 1
    
    return {"sent": sent_count, "total": len(target_phones)}

@app.get("/whatsapp/status")
async def whatsapp_status():
    """Get WhatsApp subscription status"""
    return {
        "subscribers": list(whatsapp_subscribers.keys()),
        "count": len(whatsapp_subscribers),
        "twilio_configured": twilio_client is not None
    }

# ============================================================================
# SCHEDULER
# ============================================================================

scheduler = None
if twilio_client:
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        scheduler = AsyncIOScheduler()
        print("[OK] APScheduler initialized")
    except Exception as e:
        print(f"[WARN] Scheduler not available: {e}")

async def send_scheduled_alerts():
    """Send alerts to all subscribers"""
    if not twilio_client or not whatsapp_subscribers:
        return
    
    print(f"[INFO] Sending scheduled alerts to {len(whatsapp_subscribers)} subscribers...")
    for phone, sub in whatsapp_subscribers.items():
        zone_id = sub.get('zone_id', 'TN-01')
        zone = next((z for z in ZONES if z['id'] == zone_id), ZONES[0])
        
        try:
            weather_data = await fetch_zone_weather(zone)
            risk_level = calculate_risk(weather_data, sub.get('boat_class', 'A'))
            
            message = format_whatsapp_message(
                zone['id'],
                zone['id'],
                risk_level,
                weather_data.get('wave_height', 0),
                weather_data.get('wind_speed', 0),
                "10-min alert"
            )
            send_whatsapp_message(phone, message)
        except Exception as e:
            print(f"[ERROR] Scheduled alert failed: {e}")

if scheduler:
    scheduler.add_job(send_scheduled_alerts, 'interval', minutes=10, id='whatsapp_alerts')
    scheduler.start()
    print("[OK] WhatsApp alert scheduler started (every 10 minutes)")

# ============================================================================
# LOGS ENDPOINT
# ============================================================================

@app.get("/logs")
async def get_logs():
    return {
        "logs": request_logs[-20:],
        "total": len(request_logs)
    }

@app.get("/stats")
async def get_stats():
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