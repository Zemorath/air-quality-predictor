import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

def load_and_prepare_data():
    """Load and prepare the air quality data for training"""
    # Load the sample dataset
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sample_air_quality.csv')
    df = pd.read_csv(data_path)
    
    # Feature engineering
    df['date'] = pd.to_datetime(df['date'])
    df['day_of_year'] = df['date'].dt.dayofyear
    df['month'] = df['date'].dt.month
    
    # Select features for prediction
    features = [
        'pm25', 'pm10', 'o3', 'no2', 'so2', 'co',
        'temperature', 'humidity', 'wind_speed', 'pressure',
        'latitude', 'longitude', 'day_of_year', 'month'
    ]
    
    X = df[features]
    y = df['aqi']
    
    return X, y, features

def train_model():
    """Train the AQI prediction model"""
    print("Loading and preparing data...")
    X, y, features = load_and_prepare_data()
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train the model
    print("Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        max_depth=10,
        min_samples_split=5
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate the model
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Performance:")
    print(f"Mean Absolute Error: {mae:.2f}")
    print(f"R² Score: {r2:.3f}")
    
    # Save the model and scaler
    model_dir = os.path.dirname(__file__)
    joblib.dump(model, os.path.join(model_dir, 'aqi_model.pkl'))
    joblib.dump(scaler, os.path.join(model_dir, 'scaler.pkl'))
    
    # Save feature names
    with open(os.path.join(model_dir, 'features.txt'), 'w') as f:
        f.write('\n'.join(features))
    
    print("Model saved successfully!")
    return model, scaler, features

def get_aqi_category(aqi):
    """Categorize AQI value"""
    if aqi <= 50:
        return {"category": "Good", "emoji": "🟢", "color": "#00e400"}
    elif aqi <= 100:
        return {"category": "Moderate", "emoji": "🟡", "color": "#ffff00"}
    elif aqi <= 150:
        return {"category": "Unhealthy for Sensitive", "emoji": "🟠", "color": "#ff7e00"}
    elif aqi <= 200:
        return {"category": "Unhealthy", "emoji": "🔴", "color": "#ff0000"}
    elif aqi <= 300:
        return {"category": "Very Unhealthy", "emoji": "🟣", "color": "#8f3f97"}
    else:
        return {"category": "Hazardous", "emoji": "🟤", "color": "#7e0023"}

if __name__ == "__main__":
    train_model()
