import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const airQualityApi = {
  // Get current air quality for coordinates
  getCurrentAirQuality: async (lat, lon) => {
    const response = await api.get(`/air-quality/${lat}/${lon}`);
    return response.data;
  },

  // Get AQI prediction
  getPrediction: async (latitude, longitude, currentData) => {
    const response = await api.post('/predict', {
      latitude,
      longitude,
      currentData,
    });
    return response.data;
  },

  // Get all locations
  getLocations: async () => {
    const response = await api.get('/locations');
    return response.data;
  },

  // Add a new location
  addLocation: async (name, latitude, longitude, country) => {
    const response = await api.post('/locations', {
      name,
      latitude,
      longitude,
      country,
    });
    return response.data;
  },

  // Get historical data for a location
  getHistoricalData: async (locationId, limit = 30) => {
    const response = await api.get(`/locations/${locationId}/history?limit=${limit}`);
    return response.data;
  },

  // Get predictions for a location
  getLocationPredictions: async (locationId, limit = 10) => {
    const response = await api.get(`/locations/${locationId}/predictions?limit=${limit}`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default airQualityApi;
