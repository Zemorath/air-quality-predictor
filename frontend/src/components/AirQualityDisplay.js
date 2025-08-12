import React from 'react';
import { Thermometer, Droplets, Wind, Gauge } from 'lucide-react';

const AirQualityDisplay = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="air-quality-card loading">
        <div className="loading-content">
          <div className="loading-text">Loading air quality data...</div>
          <div className="loading-bars">
            <div className="loading-bar"></div>
            <div className="loading-bar"></div>
            <div className="loading-bar"></div>
            <div className="loading-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="air-quality-card error">
        <div className="error-content">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="air-quality-card empty">
        <div className="empty-content">
          <Gauge className="empty-icon" />
          <p>Select a location to view air quality data</p>
        </div>
      </div>
    );
  }

  const pollutants = [
    { name: 'PM2.5', value: data.pm25, unit: 'μg/m³', icon: <Droplets className="pollutant-icon" /> },
    { name: 'PM10', value: data.pm10, unit: 'μg/m³', icon: <Droplets className="pollutant-icon" /> },
    { name: 'O₃', value: data.o3, unit: 'μg/m³', icon: <Wind className="pollutant-icon" /> },
    { name: 'NO₂', value: data.no2, unit: 'μg/m³', icon: <Wind className="pollutant-icon" /> },
    { name: 'SO₂', value: data.so2, unit: 'μg/m³', icon: <Wind className="pollutant-icon" /> },
    { name: 'CO', value: data.co, unit: 'mg/m³', icon: <Wind className="pollutant-icon" /> },
  ].filter(pollutant => pollutant.value !== null && pollutant.value !== undefined);

  const weatherData = [
    { name: 'Temperature', value: data.temperature, unit: '°C', icon: <Thermometer className="weather-icon" /> },
    { name: 'Humidity', value: data.humidity, unit: '%', icon: <Droplets className="weather-icon" /> },
    { name: 'Wind Speed', value: data.wind_speed, unit: 'm/s', icon: <Wind className="weather-icon" /> },
    { name: 'Pressure', value: data.pressure, unit: 'hPa', icon: <Gauge className="weather-icon" /> },
  ].filter(item => item.value !== null && item.value !== undefined);

  return (
    <div className="air-quality-card">
      {/* Main AQI Display */}
      <div className="aqi-main" style={{ backgroundColor: data.color }}>
        <div className="aqi-content">
          <div className="aqi-number">{data.aqi}</div>
          <div className="aqi-category">
            <span className="aqi-emoji">{data.emoji}</span>
            <span className="aqi-text">{data.category}</span>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="location-info">
        <h3 className="location-title">
          {data.city}, {data.country}
        </h3>
        <p className="location-coords">
          {data.coordinates.latitude.toFixed(4)}, {data.coordinates.longitude.toFixed(4)}
        </p>
        <p className="last-updated">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Pollutants Grid */}
      {pollutants.length > 0 && (
        <div className="pollutants-section">
          <h4 className="section-title">Pollutant Levels</h4>
          <div className="pollutants-grid">
            {pollutants.map((pollutant) => (
              <div key={pollutant.name} className="pollutant-item">
                {pollutant.icon}
                <div className="pollutant-info">
                  <span className="pollutant-name">{pollutant.name}</span>
                  <span className="pollutant-value">
                    {typeof pollutant.value === 'number' ? pollutant.value.toFixed(1) : 'N/A'} {pollutant.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Conditions */}
      {weatherData.length > 0 && (
        <div className="weather-section">
          <h4 className="section-title">Weather Conditions</h4>
          <div className="weather-grid">
            {weatherData.map((item) => (
              <div key={item.name} className="weather-item">
                {item.icon}
                <div className="weather-info">
                  <span className="weather-name">{item.name}</span>
                  <span className="weather-value">
                    {typeof item.value === 'number' ? item.value.toFixed(1) : 'N/A'} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source */}
      <div className="data-source">
        <p>Data source: {data.source}</p>
      </div>
    </div>
  );
};

export default AirQualityDisplay;
