import React, { useState, useCallback } from 'react';
import './App.css';
import MapComponent from './components/MapComponent';
import AirQualityDisplay from './components/AirQualityDisplay';
import PredictionDisplay from './components/PredictionDisplay';
import LocationSearch from './components/LocationSearch';
import HistoricalChart from './components/HistoricalChart';
import { airQualityApi } from './services/api';
import { Wind, TrendingUp, Map, Search } from 'lucide-react';

function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState({ airQuality: false, prediction: false });
  const [error, setError] = useState({ airQuality: null, prediction: null });

  const handleLocationSelect = useCallback(async (lat, lon) => {
    setSelectedLocation({ lat, lon });
    setError({ airQuality: null, prediction: null });
    
    // Load air quality data
    setLoading(prev => ({ ...prev, airQuality: true }));
    try {
      const aqData = await airQualityApi.getCurrentAirQuality(lat, lon);
      setAirQualityData(aqData);
      
      // Automatically get prediction
      setLoading(prev => ({ ...prev, prediction: true }));
      try {
        const predData = await airQualityApi.getPrediction(lat, lon, aqData);
        setPredictionData(predData);
      } catch (predError) {
        console.error('Prediction error:', predError);
        setError(prev => ({ ...prev, prediction: 'Failed to get prediction' }));
      } finally {
        setLoading(prev => ({ ...prev, prediction: false }));
      }
      
    } catch (aqError) {
      console.error('Air quality error:', aqError);
      setError(prev => ({ ...prev, airQuality: 'Failed to get air quality data' }));
      setAirQualityData(null);
    } finally {
      setLoading(prev => ({ ...prev, airQuality: false }));
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Wind className="logo-icon" />
            <h1>Air Quality Predictor</h1>
          </div>
          <p className="tagline">Monitor air quality and predict future conditions worldwide</p>
        </div>
      </header>

      <main className="app-main">
        <div className="controls-section">
          <div className="search-container">
            <Search className="search-icon" />
            <LocationSearch onLocationSelect={handleLocationSelect} />
          </div>
          
          {selectedLocation && (
            <div className="location-info">
              <Map className="location-icon" />
              <span>
                Selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        <div className="content-grid">
          <div className="map-section">
            <div className="section-header">
              <h2>Interactive Map</h2>
              <p>Click anywhere on the map to get air quality data</p>
            </div>
            <MapComponent
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
              airQualityData={airQualityData}
            />
          </div>

          <div className="data-section">
            {airQualityData && (
              <div className="air-quality-section">
                <div className="section-header">
                  <h2>Current Air Quality</h2>
                  <p>Real-time air quality data for selected location</p>
                </div>
                <AirQualityDisplay 
                  data={airQualityData} 
                  loading={loading.airQuality}
                  error={error.airQuality}
                />
              </div>
            )}

            {predictionData && (
              <div className="prediction-section">
                <div className="section-header">
                  <TrendingUp className="section-icon" />
                  <h2>AQI Prediction</h2>
                  <p>Machine learning prediction for future air quality</p>
                </div>
                <PredictionDisplay 
                  data={predictionData}
                  loading={loading.prediction}
                  error={error.prediction}
                />
              </div>
            )}

            {selectedLocation && (
              <div className="charts-section">
                <div className="section-header">
                  <h2>Historical Trends</h2>
                  <p>Air quality trends over time</p>
                </div>
                <HistoricalChart location={selectedLocation} />
              </div>
            )}
          </div>
        </div>

        {!selectedLocation && (
          <div className="welcome-section">
            <div className="welcome-content">
              <Wind size={64} className="welcome-icon" />
              <h2>Welcome to Air Quality Predictor</h2>
              <p>Click on the map or search for a location to get started</p>
              <div className="features">
                <div className="feature">
                  <Map className="feature-icon" />
                  <span>Interactive global map</span>
                </div>
                <div className="feature">
                  <TrendingUp className="feature-icon" />
                  <span>ML-powered predictions</span>
                </div>
                <div className="feature">
                  <Wind className="feature-icon" />
                  <span>Real-time air quality data</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2025 Air Quality Predictor. Data provided by various air quality monitoring services.</p>
      </footer>
    </div>
  );
}

export default App;
