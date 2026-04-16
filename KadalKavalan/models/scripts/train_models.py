#!/usr/bin/env python3
"""
Local Training Script for Kadal Kavalan ML Models
Trains 3 models: Day Safety, Hourly Risk, Return Time

Usage:
    python train_models.py [--data_dir ./data] [--output_dir ./models]

Requirements:
    pip install pandas scikit-learn xgboost numpy
"""

import argparse
import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, r2_score
import joblib

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
    """Estimate tide state based on hour"""
    hour_in_day = (day - 1) * 24 + hour
    position = hour_in_day % 24.84
    if position < 6:
        return 'rising'
    elif position < 12:
        return 'high'
    elif position < 18:
        return 'falling'
    else:
        return 'low'


async def fetch_historical_data():
    """Fetch 2 years of marine weather data from Open-Meteo"""
    import aiohttp
    
    print("=== Fetching Historical Data ===")
    all_data = []
    
    for zone in ZONES:
        for boat_class in BOAT_CLASSES:
            url = f"{OPEN_METEO_ARCHIVE}?latitude={zone['lat']}&longitude={zone['lon']}&start_date=2023-01-01&end_date=2024-12-31&hourly=wave_height,swell_height,wind_speed_10m,wind_gusts_10m,visibility,weather_code&timezone=auto"
            
            print(f"Fetching {zone['id']} ({boat_class})...")
            
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            if 'hourly' in data and 'time' in data['hourly']:
                                timestamps = data['hourly']['time']
                                
                                for i, ts in enumerate(timestamps):
                                    dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                                    
                                    all_data.append({
                                        'zone_id': zone['id'],
                                        'boat_class': boat_class,
                                        'timestamp': ts,
                                        'month': dt.month,
                                        'day': dt.day,
                                        'hour': dt.hour,
                                        'wave_height': data['hourly'].get('wave_height', [0]*len(timestamps))[i] or 0,
                                        'wind_speed': data['hourly'].get('wind_speed_10m', [0]*len(timestamps))[i] or 0,
                                        'wind_gust': data['hourly'].get('wind_gusts_10m', [0]*len(timestamps))[i] or 0,
                                        'swell_height': data['hourly'].get('swell_height', [0]*len(timestamps))[i] or 0,
                                        'visibility': (data['hourly'].get('visibility', [10000]*len(timestamps))[i] or 10000) / 1000,
                                        'weather_code': data['hourly'].get('weather_code', [0]*len(timestamps))[i] or 0,
                                        'tide_state': get_tide_state(dt.hour, dt.day),
                                    })
                        await asyncio.sleep(1)
            except Exception as e:
                print(f"Error fetching {zone['id']}: {e}")
    
    print(f"Total data points: {len(all_data)}")
    return pd.DataFrame(all_data)


def fetch_historical_data_sync():
    """Synchronous version using requests"""
    import requests
    
    print("=== Fetching Historical Data (Sync) ===")
    all_data = []
    
    for zone in ZONES:
        for boat_class in BOAT_CLASSES:
            url = f"{OPEN_METEO_ARCHIVE}?latitude={zone['lat']}&longitude={zone['lon']}&start_date=2023-01-01&end_date=2024-12-31&hourly=wave_height,swell_height,wind_speed_10m,wind_gusts_10m,visibility,weather_code&timezone=auto"
            
            print(f"Fetching {zone['id']} ({boat_class})...")
            
            try:
                response = requests.get(url, timeout=30)
                data = response.json()
                
                if 'hourly' in data and 'time' in data['hourly']:
                    timestamps = data['hourly']['time']
                    
                    for i, ts in enumerate(timestamps):
                        dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                        
                        all_data.append({
                            'zone_id': zone['id'],
                            'boat_class': boat_class,
                            'timestamp': ts,
                            'month': dt.month,
                            'day': dt.day,
                            'hour': dt.hour,
                            'wave_height': data['hourly'].get('wave_height', [0]*len(timestamps))[i] or 0,
                            'wind_speed': data['hourly'].get('wind_speed_10m', [0]*len(timestamps))[i] or 0,
                            'wind_gust': data['hourly'].get('wind_gusts_10m', [0]*len(timestamps))[i] or 0,
                            'swell_height': data['hourly'].get('swell_height', [0]*len(timestamps))[i] or 0,
                            'visibility': (data['hourly'].get('visibility', [10000]*len(timestamps))[i] or 10000) / 1000,
                            'weather_code': data['hourly'].get('weather_code', [0]*len(timestamps))[i] or 0,
                            'tide_state': get_tide_state(dt.hour, dt.day),
                        })
                
                import time
                time.sleep(1)
            except Exception as e:
                print(f"Error fetching {zone['id']}: {e}")
    
    print(f"Total data points: {len(all_data)}")
    return pd.DataFrame(all_data)


def get_boat_limits(boat_class):
    """Get safety limits for boat class"""
    limits = {
        'A': {'wave': 1.0, 'wind': 28, 'gust': 35, 'vis': 3},
        'B': {'wave': 2.0, 'wind': 40, 'gust': 50, 'vis': 2},
        'C': {'wave': 3.5, 'wind': 55, 'gust': 65, 'vis': 1},
    }
    return limits[boat_class]


def calculate_risk_score(wave, wind, gust, swell, vis, boat_class):
    """Calculate risk score using existing logic"""
    limits = get_boat_limits(boat_class)
    
    wave_ratio = wave / limits['wave']
    wind_ratio = max(wind, gust * 0.8) / limits['wind']
    vis_ratio = vis / limits['vis']
    
    wave_score = min(100, wave_ratio * 80)
    wind_score = min(100, wind_ratio * 80)
    vis_score = 0 if vis_ratio >= 1 else (30 if vis_ratio >= 0.5 else 70)
    
    score = wave_score * 0.4 + wind_score * 0.4 + vis_score * 0.2
    return min(100, max(0, score))


def calculate_return_time(wave, wind, swell, boat_class):
    """Estimate return time in hours"""
    limits = get_boat_limits(boat_class)
    
    base_time = 6
    wave_delay = max(0, (wave - limits['wave'] * 0.5)) * 2
    wind_delay = max(0, (wind - limits['wind'] * 0.5)) * 0.1
    
    return min(12, max(2, round(base_time + wave_delay + wind_delay)))


def generate_labels(df):
    """Generate training labels from raw data"""
    print("=== Generating Labels ===")
    
    df['risk_score'] = df.apply(
        lambda r: calculate_risk_score(
            r['wave_height'], r['wind_speed'], r['wind_gust'],
            r['swell_height'], r['visibility'], r['boat_class']
        ), axis=1
    )
    
    df['target_day_safe'] = (df['risk_score'] < 30).astype(int)
    df['target_hourly_risk'] = df['risk_score']
    df['target_return_hours'] = df.apply(
        lambda r: calculate_return_time(r['wave_height'], r['wind_speed'], r['swell_height'], r['boat_class']),
        axis=1
    )
    
    safe_count = df['target_day_safe'].sum()
    print(f"SAFE: {safe_count}, UNSAFE: {len(df) - safe_count}")
    print(f"Avg Risk Score: {df['risk_score'].mean():.1f}")
    print(f"Avg Return Time: {df['target_return_hours'].mean():.1f} hours")
    
    return df


def prepare_features(df):
    """Prepare features for training"""
    print("=== Preparing Features ===")
    
    zone_map = {z['id']: i for i, z in enumerate(ZONES)}
    
    df['zone_encoded'] = df['zone_id'].map(zone_map)
    df['boat_encoded'] = df['boat_class'].map({'A': 0, 'B': 1, 'C': 2})
    df['tide_encoded'] = df['tide_state'].map({'rising': 0, 'high': 1, 'falling': 2, 'low': 3})
    
    feature_cols = [
        'zone_encoded', 'boat_encoded', 'month', 'day', 'hour',
        'wave_height', 'wind_speed', 'wind_gust', 'swell_height',
        'visibility', 'weather_code', 'tide_encoded'
    ]
    
    return df, feature_cols


def train_day_safety_model(df, feature_cols):
    """Train Day Safety Classification Model"""
    print("\n=== Training Day Safety Model ===")
    
    X = df[feature_cols].values
    y = df['target_day_safe'].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print(f"Accuracy: {accuracy:.3f}")
    print(f"F1 Score: {f1:.3f}")
    
    return model, {'accuracy': accuracy, 'f1': f1}


def train_hourly_risk_model(df, feature_cols):
    """Train Hourly Risk Regression Model"""
    print("\n=== Training Hourly Risk Model ===")
    
    X = df[feature_cols].values
    y = df['target_hourly_risk'].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"RMSE: {rmse:.3f}")
    print(f"R2 Score: {r2:.3f}")
    
    return model, {'rmse': rmse, 'r2': r2}


def train_return_time_model(df, feature_cols):
    """Train Return Time Regression Model"""
    print("\n=== Training Return Time Model ===")
    
    X = df[feature_cols].values
    y = df['target_return_hours'].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"RMSE: {rmse:.3f} hours")
    print(f"R2 Score: {r2:.3f}")
    
    return model, {'rmse': rmse, 'r2': r2}


def save_models(models, metrics, output_dir):
    """Save trained models"""
    print(f"\n=== Saving Models to {output_dir} ===")
    
    os.makedirs(output_dir, exist_ok=True)
    
    for name, (model, model_metrics) in models.items():
        model_path = os.path.join(output_dir, f"{name}_model.joblib")
        joblib.dump(model, model_path)
        print(f"Saved: {model_path}")
        
        metrics_path = os.path.join(output_dir, f"{name}_metrics.json")
        with open(metrics_path, 'w') as f:
            json.dump(model_metrics, f, indent=2)
        print(f"saved: {metrics_path}")
    
    config = {
        'zones': ZONES,
        'boat_classes': BOAT_CLASSES,
        'feature_columns': [
            'zone_encoded', 'boat_encoded', 'month', 'day', 'hour',
            'wave_height', 'wind_speed', 'wind_gust', 'swell_height',
            'visibility', 'weather_code', 'tide_encoded'
        ],
        'training_date': datetime.now().isoformat()
    }
    
    config_path = os.path.join(output_dir, 'config.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"saved: {config_path}")


def main():
    parser = argparse.ArgumentParser(description='Train Kadal Kavalan ML Models')
    parser.add_argument('--data_dir', default='./data', help='Data directory')
    parser.add_argument('--output_dir', default='./models', help='Output directory')
    parser.add_argument('--use_existing', action='store_true', help='Use existing CSV if available')
    args = parser.parse_args()
    
    data_path = os.path.join(args.data_dir, 'historical_data.csv')
    labeled_path = os.path.join(args.data_dir, 'labeled_data.csv')
    
    if args.use_existing and os.path.exists(labeled_path):
        print(f"Loading existing data from {labeled_path}")
        df = pd.read_csv(labeled_path)
    elif args.use_existing and os.path.exists(data_path):
        print(f"Loading existing data from {data_path}")
        df = pd.read_csv(data_path)
        df = generate_labels(df)
        df.to_csv(labeled_path, index=False)
    else:
        df = fetch_historical_data_sync()
        df = generate_labels(df)
        os.makedirs(args.data_dir, exist_ok=True)
        df.to_csv(labeled_path, index=False)
    
    df, feature_cols = prepare_features(df)
    
    models = {}
    metrics = {}
    
    model, m = train_day_safety_model(df, feature_cols)
    models['day_safety'] = (model, m)
    metrics['day_safety'] = m
    
    model, m = train_hourly_risk_model(df, feature_cols)
    models['hourly_risk'] = (model, m)
    metrics['hourly_risk'] = m
    
    model, m = train_return_time_model(df, feature_cols)
    models['return_time'] = (model, m)
    metrics['return_time'] = m
    
    save_models(models, metrics, args.output_dir)
    
    print("\n=== Training Complete ===")
    print(f"Models saved to: {args.output_dir}")


if __name__ == '__main__':
    main()