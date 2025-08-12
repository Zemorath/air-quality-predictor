import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { airQualityApi } from '../services/api';

const HistoricalChart = ({ location }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location) return;

    const loadHistoricalData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, try to get location ID or create location
        const locations = await airQualityApi.getLocations();
        let locationData = locations.find(
          loc => Math.abs(loc.latitude - location.lat) < 0.01 && 
                Math.abs(loc.longitude - location.lon) < 0.01
        );

        if (!locationData) {
          // Create new location if it doesn't exist
          locationData = await airQualityApi.addLocation(
            `Location ${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`,
            location.lat,
            location.lon
          );
        }

        // Get historical data for this location
        const histData = await airQualityApi.getHistoricalData(locationData.id, 30);
        
        // Format data for the chart
        const formattedData = histData.map(item => ({
          date: new Date(item.date).toLocaleDateString(),
          aqi: item.aqi,
          pm25: item.pm25,
          pm10: item.pm10,
          o3: item.o3,
          no2: item.no2,
        })).reverse(); // Show oldest to newest

        setHistoricalData(formattedData);
      } catch (err) {
        console.error('Failed to load historical data:', err);
        setError('Failed to load historical data');
        
        // Generate some mock data for demonstration
        const mockData = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockData.push({
            date: date.toLocaleDateString(),
            aqi: Math.floor(Math.random() * 150) + 20,
            pm25: Math.floor(Math.random() * 50) + 10,
            pm10: Math.floor(Math.random() * 80) + 20,
            o3: Math.floor(Math.random() * 100) + 30,
            no2: Math.floor(Math.random() * 60) + 15,
          });
        }
        setHistoricalData(mockData);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalData();
  }, [location]);

  if (loading) {
    return (
      <div className="historical-chart loading">
        <div className="loading-content">
          <BarChart3 className="loading-icon" />
          <div className="loading-text">Loading historical data...</div>
        </div>
      </div>
    );
  }

  if (error && historicalData.length === 0) {
    return (
      <div className="historical-chart error">
        <div className="error-content">
          <BarChart3 className="error-icon" />
          <h3>Data Unavailable</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="historical-chart empty">
        <div className="empty-content">
          <BarChart3 className="empty-icon" />
          <p>Select a location to view historical trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historical-chart">
      <div className="chart-header">
        <div className="chart-title">
          <TrendingUp className="chart-icon" />
          <h3>30-Day Air Quality Trends</h3>
        </div>
        {error && (
          <p className="chart-note">Note: Showing sample data - {error}</p>
        )}
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="aqi" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="AQI"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="pm25" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="PM2.5"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="pm10" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="PM10"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-summary">
        <p>
          Showing air quality trends for the selected location over the past 30 days.
          {historicalData.length > 0 && (
            <>
              {' '}Current average AQI: {Math.round(
                historicalData.reduce((sum, item) => sum + item.aqi, 0) / historicalData.length
              )}
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default HistoricalChart;
