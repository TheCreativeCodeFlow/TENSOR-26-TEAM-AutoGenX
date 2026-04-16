"""
Kadal Kavalan ML Models - Google Colab Training Script

This script runs entirely in Google Colab (browser-based, no local machine needed).

Steps:
1. Go to https://colab.research.google.com
2. Create new notebook
3. Copy-paste this entire script
4. Run cells in order

Estimated time: 15-20 minutes
"""

# ============================================================================
# STEP 1: SETUP AND INSTALL DEPENDENCIES
# ============================================================================

# @markdown ## Step 1: Run this cell to install dependencies
!pip install pandas scikit-learn xgboost requests -q
print("Dependencies installed!")

# ============================================================================
# STEP 2: FETCH HISTORICAL DATA FROM OPEN-METEO
# ============================================================================

# @markdown ## Step 2: Run this cell to fetch 2 years of data
import pandas as pd
import requests
import time
import json
from datetime import datetime

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

BOAT_CLASSES = ['A', 'B', 'C']
OPEN_METEO_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive'

def get_tide_state(hour, day):
    hour_in_day = (day - 1) * 24 + hour
    position = hour_in_day % 24.84
    if position < 6: return 'rising'
    elif position < 12: return 'high'
    elif position < 18: return 'falling'
    else: return 'low'

def fetch_all_data():
    """Fetch 2 years of marine weather data"""
    all_data = []
    
    print("=== Fetching Historical Data ===")
    print("This will take ~5 minutes...")
    
    for zone in ZONES:
        for boat_class in BOAT_CLASSES:
            url = f"{OPEN_METEO_ARCHIVE}?latitude={zone['lat']}&longitude={zone['lon']}&start_date=2023-01-01&end_date=2024-12-31&hourly=wave_height,swell_height,wind_speed_10m,wind_gusts_10m,visibility,weather_code&timezone=auto"
            
            print(f"Fetching {zone['id']} ({boat_class})...")
            
            try:
                response = requests.get(url, timeout=60)
                data = response.json()
                
                if 'hourly' in data and 'time' in data['hourly']:
                    timestamps = data['hourly']['time']
                    n = len(timestamps)
                    
                    for i, ts in enumerate(timestamps):
                        dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                        
                        all_data.append({
                            'zone_id': zone['id'],
                            'boat_class': boat_class,
                            'timestamp': ts,
                            'month': dt.month,
                            'day': dt.day,
                            'hour': dt.hour,
                            'wave_height': data['hourly'].get('wave_height', [0]*n)[i] or 0,
                            'wind_speed': data['hourly'].get('wind_speed_10m', [0]*n)[i] or 0,
                            'wind_gust': data['hourly'].get('wind_gusts_10m', [0]*n)[i] or 0,
                            'swell_height': data['hourly'].get('swell_height', [0]*n)[i] or 0,
                            'visibility': (data['hourly'].get('visibility', [10000]*n)[i] or 10000) / 1000,
                            'weather_code': data['hourly'].get('weather_code', [0]*n)[i] or 0,
                            'tide_state': get_tide_state(dt.hour, dt.day),
                        })
                
                time.sleep(0.5)  # Rate limiting
            except Exception as e:
                print(f"Error {zone['id']}: {e}")
    
    print(f"Total rows: {len(all_data)}")
    return pd.DataFrame(all_data)

# Run data fetching
df_raw = fetch_all_data()
print(f"\nData shape: {df_raw.shape}")
print(df_raw.head())

# ============================================================================
# STEP 3: GENERATE LABELS FROM EXISTING RISK LOGIC
# ============================================================================

# @markdown ## Step 3: Run this cell to generate training labels
BOAT_LIMITS = {
    'A': {'wave': 1.0, 'wind': 28, 'gust': 35, 'vis': 3},
    'B': {'wave': 2.0, 'wind': 40, 'gust': 50, 'vis': 2},
    'C': {'wave': 3.5, 'wind': 55, 'gust': 65, 'vis': 1},
}

def calculate_risk_score(row):
    """Calculate risk score using existing boat class limits"""
    limits = BOAT_LIMITS[row['boat_class']]
    
    wave_ratio = row['wave_height'] / limits['wave']
    wind_ratio = max(row['wind_speed'], row['wind_gust'] * 0.8) / limits['wind']
    vis_ratio = row['visibility'] / limits['vis']
    
    wave_score = min(100, wave_ratio * 80)
    wind_score = min(100, wind_ratio * 80)
    vis_score = 0 if vis_ratio >= 1 else (30 if vis_ratio >= 0.5 else 70)
    
    score = wave_score * 0.4 + wind_score * 0.4 + vis_score * 0.2
    return min(100, max(0, score))

def calculate_return_time(row):
    """Estimate return time"""
    limits = BOAT_LIMITS[row['boat_class']]
    base = 6
    wave_delay = max(0, (row['wave_height'] - limits['wave'] * 0.5)) * 2
    wind_delay = max(0, (row['wind_speed'] - limits['wind'] * 0.5)) * 0.1
    return min(12, max(2, round(base + wave_delay + wind_delay)))

# Generate labels
df_raw['risk_score'] = df_raw.apply(calculate_risk_score, axis=1)
df_raw['target_day_safe'] = (df_raw['risk_score'] < 30).astype(int)
df_raw['target_hourly_risk'] = df_raw['risk_score']
df_raw['target_return_hours'] = df_raw.apply(calculate_return_time, axis=1)

print("=== Labels Generated ===")
print(f"SAFE: {df_raw['target_day_safe'].sum()}, UNSAFE: {len(df_raw) - df_raw['target_day_safe'].sum()}")
print(f"Avg Risk Score: {df_raw['risk_score'].mean():.1f}")
print(f"Avg Return Time: {df_raw['target_return_hours'].mean():.1f} hours")

# ============================================================================
# STEP 4: PREPARE FEATURES
# ============================================================================

# @markdown ## Step 4: Run this cell to prepare features
zone_map = {z['id']: i for i, z in enumerate(ZONES)}
df_raw['zone_encoded'] = df_raw['zone_id'].map(zone_map)
df_raw['boat_encoded'] = df_raw['boat_class'].map({'A': 0, 'B': 1, 'C': 2})
df_raw['tide_encoded'] = df_raw['tide_state'].map({'rising': 0, 'high': 1, 'falling': 2, 'low': 3})

FEATURE_COLS = [
    'zone_encoded', 'boat_encoded', 'month', 'day', 'hour',
    'wave_height', 'wind_speed', 'wind_gust', 'swell_height',
    'visibility', 'weather_code', 'tide_encoded'
]

X = df_raw[FEATURE_COLS].values
y_day_safe = df_raw['target_day_safe'].values
y_risk = df_raw['target_hourly_risk'].values
y_return = df_raw['target_return_hours'].values

print(f"Features shape: {X.shape}")
print(f"Feature columns: {FEATURE_COLS}")

# ============================================================================
# STEP 5: TRAIN MODELS
# ============================================================================

# @markdown ## Step 5: Run this cell to train all 3 models
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, r2_score
import numpy as np

# Split data
X_train, X_test, y_safe_train, y_safe_test = train_test_split(X, y_day_safe, test_size=0.2, random_state=42)
_, _, y_risk_train, y_risk_test = train_test_split(X, y_risk, test_size=0.2, random_state=42)
_, _, y_return_train, y_return_test = train_test_split(X, y_return, test_size=0.2, random_state=42)

# --- Model 1: Day Safety ---
print("\n=== Training Day Safety Model ===")
model_day_safety = RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42, n_jobs=-1)
model_day_safety.fit(X_train, y_safe_train)

y_pred = model_day_safety.predict(X_test)
acc = accuracy_score(y_safe_test, y_pred)
f1 = f1_score(y_safe_test, y_pred)
print(f"Accuracy: {acc:.3f}, F1: {f1:.3f}")

# --- Model 2: Hourly Risk ---
print("\n=== Training Hourly Risk Model ===")
model_hourly_risk = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42, n_jobs=-1)
model_hourly_risk.fit(X_train, y_risk_train)

y_pred = model_hourly_risk.predict(X_test)
rmse_risk = np.sqrt(mean_squared_error(y_risk_test, y_pred))
r2_risk = r2_score(y_risk_test, y_pred)
print(f"RMSE: {rmse_risk:.3f}, R2: {r2_risk:.3f}")

# --- Model 3: Return Time ---
print("\n=== Training Return Time Model ===")
model_return_time = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42, n_jobs=-1)
model_return_time.fit(X_train, y_return_train)

y_pred = model_return_time.predict(X_test)
rmse_return = np.sqrt(mean_squared_error(y_return_test, y_pred))
r2_return = r2_score(y_return_test, y_pred)
print(f"RMSE: {rmse_return:.3f} hours, R2: {r2_return:.3f}")

# ============================================================================
# STEP 6: SAVE MODELS
# ============================================================================

# @markdown ## Step 6: Run this cell to download models
import joblib
from google.colab import files

print("\n=== Saving Models ===")

# Save Day Safety
joblib.dump(model_day_safety, 'day_safety_model.joblib')
print("Saved: day_safety_model.joblib")

# Save Hourly Risk
joblib.dump(model_hourly_risk, 'hourly_risk_model.joblib')
print("Saved: hourly_risk_model.joblib")

# Save Return Time
joblib.dump(model_return_time, 'return_time_model.joblib')
print("Saved: return_time_model.joblib")

# Save config
config = {
    'zones': ZONES,
    'feature_columns': FEATURE_COLS,
    'training_date': datetime.now().isoformat()
}
with open('config.json', 'w') as f:
    json.dump(config, f, indent=2)
print("Saved: config.json")

print("\n=== Training Complete! ===")
print("Download the .joblib files below and place them in models/ directory")

# ============================================================================
# STEP 7: DOWNLOAD
# ============================================================================

# @markdown ## Step 7: Click the download buttons below
files.download('day_safety_model.joblib')
files.download('hourly_risk_model.joblib')
files.download('return_time_model.joblib')
files.download('config.json')