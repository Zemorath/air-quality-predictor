import pandas as pd
import numpy as np
import joblib
import os
import sys
import json
from datetime import datetime

def load_model():
    """Load the trained model and scaler"""
    model_dir = os.path.dirname(__file__)
    
    try:
        model = joblib.load(os.path.join(model_dir, 'aqi_model.pkl'))
        scaler = joblib.load(os.path.join(model_dir, 'scaler.pkl'))
        
        # Load feature names
        with open(os.path.join(model_dir, 'features.txt'), 'r') as f:
            features = [line.strip() for line in f.readlines()]
        
        return model, scaler, features
    except FileNotFoundError:
        raise Exception("Model not found. Please run train_model.py first.")

def predict_aqi(data):
    """
    Predict AQI based on input data
    
    Args:
        data (dict): Dictionary containing prediction features
    
    Returns:
        dict: Prediction result with AQI value and category
    """
    model, scaler, features = load_model()
    
    # Create DataFrame from input data
    input_df = pd.DataFrame([data])
    
    # Add date-based features if not present
    if 'day_of_year' not in input_df.columns:
        current_date = datetime.now()
        input_df['day_of_year'] = current_date.timetuple().tm_yday
        input_df['month'] = current_date.month
    
    # Ensure all required features are present
    for feature in features:
        if feature not in input_df.columns:
            # Set default values for missing features
            defaults = {
                'pm25': 15.0, 'pm10': 25.0, 'o3': 40.0, 'no2': 30.0,
                'so2': 8.0, 'co': 1.0, 'temperature': 20.0, 'humidity': 60.0,
                'wind_speed': 8.0, 'pressure': 1013.25, 'latitude': 0.0,
                'longitude': 0.0, 'day_of_year': 1, 'month': 1
            }
            input_df[feature] = defaults.get(feature, 0)
    
    # Select and order features
    X = input_df[features]
    
    # Scale features
    X_scaled = scaler.transform(X)
    
    # Make prediction
    prediction = model.predict(X_scaled)[0]
    
    # Get category information
    category_info = get_aqi_category(prediction)
    
    return {
        'predicted_aqi': round(prediction, 1),
        'category': category_info['category'],
        'emoji': category_info['emoji'],
        'color': category_info['color']
    }

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

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python predict.py '<json_data>'")
        print("Example: python predict.py '{\"pm25\": 25, \"pm10\": 35, \"latitude\": 40.7128, \"longitude\": -74.0060}'")
        return
    
    try:
        # Parse JSON input
        input_data = json.loads(sys.argv[1])
        
        # Make prediction
        result = predict_aqi(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
