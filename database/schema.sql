-- Air Quality Predictor Database Schema

-- Table for storing location data
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(latitude, longitude)
);

-- Table for storing historical air quality data
CREATE TABLE IF NOT EXISTS air_quality_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER,
    date DATE NOT NULL,
    pm25 REAL,
    pm10 REAL,
    o3 REAL,
    no2 REAL,
    so2 REAL,
    co REAL,
    temperature REAL,
    humidity REAL,
    wind_speed REAL,
    pressure REAL,
    aqi INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations (id),
    UNIQUE(location_id, date)
);

-- Table for storing predictions
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER,
    prediction_date DATE NOT NULL,
    predicted_aqi REAL NOT NULL,
    category TEXT NOT NULL,
    confidence_score REAL,
    input_features TEXT, -- JSON string of input features
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations (id)
);

-- Insert some sample locations
INSERT OR IGNORE INTO locations (name, latitude, longitude, country) VALUES
('New York', 40.7128, -74.0060, 'USA'),
('Los Angeles', 34.0522, -118.2437, 'USA'),
('London', 51.5074, -0.1278, 'UK'),
('Beijing', 39.9042, 116.4074, 'China'),
('Tokyo', 35.6762, 139.6503, 'Japan'),
('Delhi', 28.7041, 77.1025, 'India'),
('Paris', 48.8566, 2.3522, 'France'),
('Sydney', -33.8688, 151.2093, 'Australia'),
('Mumbai', 19.0760, 72.8777, 'India'),
('Mexico City', 19.4326, -99.1332, 'Mexico');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_air_quality_date ON air_quality_data(date);
CREATE INDEX IF NOT EXISTS idx_air_quality_location ON air_quality_data(location_id);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictions_location ON predictions(location_id);
