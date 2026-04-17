"""
SeaGuard - XGBoost Training Script
Use existing labeled_data.csv if available
"""

import pandas as pd
import json
import os
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, r2_score

try:
    import xgboost as xgb
    USE_XGBOOST = True
    print("Using XGBoost")
except ImportError:
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    USE_XGBOOST = False
    print("XGBoost not found, using RandomForest")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'backend')

ZONES = [
    {'id': 'TN-01'}, {'id': 'TN-02'}, {'id': 'TN-03'}, {'id': 'TN-04'},
    {'id': 'KL-01'}, {'id': 'KL-02'}, {'id': 'KL-03'},
    {'id': 'AP-01'}, {'id': 'AP-02'},
    {'id': 'OD-01'}, {'id': 'OD-02'},
]

BOAT_LIMITS = {
    'A': {'wave': 1.0, 'wind': 28},
    'B': {'wave': 2.0, 'wind': 40},
    'C': {'wave': 3.5, 'wind': 55},
}

def main():
    print("=== SeaGuard XGBoost Training ===\n")
    
    dataPath = os.path.join(os.path.dirname(__file__), '..', 'data', 'labeled_data.csv')
    
    if not os.path.exists(dataPath):
        print(f"Error: {dataPath} not found!")
        print("Run fetch_historical_data.js and generate_labels.js first")
        return
    
    print(f"Loading data from: {dataPath}")
    df = pd.read_csv(dataPath)
    print(f"Loaded {len(df)} rows\n")
    
    zone_map = {z['id']: i for i, z in enumerate(ZONES)}
    df['zone_encoded'] = df['zone_id'].map(zone_map)
    df['boat_encoded'] = df['boat_class'].map({'A': 0, 'B': 1, 'C': 2})
    df['tide_encoded'] = df['tide_state'].map({'rising': 0, 'high': 1, 'falling': 2, 'low': 3})
    
    FEATURE_COLS = [
        'zone_encoded', 'boat_encoded', 'month', 'day', 'hour',
        'wave_height', 'wind_speed', 'wind_gust', 'swell_height',
        'visibility', 'weather_code', 'tide_encoded'
    ]
    
    X = df[FEATURE_COLS].values
    y_safe = df['target_day_safe'].values
    y_risk = df['target_hourly_risk'].values
    y_return = df['target_return_hours'].values
    
    print("Features shape:", X.shape)
    
    X_train, X_test, y_safe_train, y_safe_test = train_test_split(X, y_safe, test_size=0.2, random_state=42)
    _, _, y_risk_train, y_risk_test = train_test_split(X, y_risk, test_size=0.2, random_state=42)
    _, _, y_return_train, y_return_test = train_test_split(X, y_return, test_size=0.2, random_state=42)
    
    # Model 1: Day Safety
    print("\n=== Training Day Safety Model ===")
    if USE_XGBOOST:
        model1 = xgb.XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1, verbosity=0)
    else:
        model1 = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
    model1.fit(X_train, y_safe_train)
    y_pred = model1.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_safe_test, y_pred):.3f}, F1: {f1_score(y_safe_test, y_pred):.3f}")
    
    # Model 2: Hourly Risk
    print("\n=== Training Hourly Risk Model ===")
    if USE_XGBOOST:
        model2 = xgb.XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1, verbosity=0)
    else:
        model2 = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
    model2.fit(X_train, y_risk_train)
    y_pred = model2.predict(X_test)
    print(f"RMSE: {np.sqrt(mean_squared_error(y_risk_test, y_pred)):.3f}, R2: {r2_score(y_risk_test, y_pred):.3f}")
    
    # Model 3: Return Time
    print("\n=== Training Return Time Model ===")
    if USE_XGBOOST:
        model3 = xgb.XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1, verbosity=0)
    else:
        model3 = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
    model3.fit(X_train, y_return_train)
    y_pred = model3.predict(X_test)
    print(f"RMSE: {np.sqrt(mean_squared_error(y_return_test, y_pred)):.3f} hours, R2: {r2_score(y_return_test, y_pred):.3f}")
    
    # Save models
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    if USE_XGBOOST:
        model1.save_model(os.path.join(OUTPUT_DIR, 'day_safety.json'))
        model2.save_model(os.path.join(OUTPUT_DIR, 'hourly_risk.json'))
        model3.save_model(os.path.join(OUTPUT_DIR, 'return_time.json'))
    else:
        import joblib
        joblib.dump(model1, os.path.join(OUTPUT_DIR, 'day_safety.joblib'))
        joblib.dump(model2, os.path.join(OUTPUT_DIR, 'hourly_risk.joblib'))
        joblib.dump(model3, os.path.join(OUTPUT_DIR, 'return_time.joblib'))
    
    config = {
        'zones': ZONES,
        'feature_columns': FEATURE_COLS,
        'training_date': datetime.now().isoformat(),
        'model_type': 'xgboost' if USE_XGBOOST else 'random_forest'
    }
    with open(os.path.join(OUTPUT_DIR, 'config.json'), 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"\n=== Training Complete! ===")
    print(f"Models saved to: {OUTPUT_DIR}")

if __name__ == '__main__':
    main()