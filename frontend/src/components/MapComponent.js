import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { airQualityApi } from '../services/api';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapComponent = ({
  onLocationSelect,
  selectedLocation,
  airQualityData,
}) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationsData = await airQualityApi.getLocations();
        setLocations(locationsData);
      } catch (error) {
        console.error('Failed to load locations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  // Create custom marker icon based on AQI category
  const createAQIMarker = (aqi) => {
    let color = '#22c55e'; // Good - Green
    if (aqi > 150) color = '#dc2626'; // Unhealthy - Red
    else if (aqi > 100) color = '#f59e0b'; // Moderate - Yellow
    else if (aqi > 50) color = '#f97316'; // Moderate - Orange

    return L.divIcon({
      className: 'custom-aqi-marker',
      html: `<div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">${Math.round(aqi)}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // Component to handle map clicks
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
      },
    });
    return null;
  };

  return (
    <div className="map-container">
      <MapContainer
        center={[40.7128, -74.0060]} // Default to New York
        zoom={5}
        style={{ height: '500px', width: '100%' }}
        className="leaflet-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapClickHandler />

        {/* Show existing locations */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            eventHandlers={{
              click: () => onLocationSelect(location.latitude, location.longitude),
            }}
          >
            <Popup>
              <div className="location-popup">
                <h3>{location.name}</h3>
                <p>{location.country}</p>
                <p>
                  Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </p>
                <button
                  onClick={() => onLocationSelect(location.latitude, location.longitude)}
                  className="popup-button"
                >
                  Get Air Quality
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Show selected location with air quality data */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lon]}
            icon={
              airQualityData
                ? createAQIMarker(airQualityData.aqi)
                : new L.Icon.Default()
            }
          >
            <Popup>
              <div className="selected-location-popup">
                <h3>Selected Location</h3>
                <p>
                  Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                </p>
                {airQualityData && (
                  <div className="popup-air-quality">
                    <h4>Air Quality: {airQualityData.category}</h4>
                    <p>AQI: {airQualityData.aqi} {airQualityData.emoji}</p>
                    <p>Location: {airQualityData.city}, {airQualityData.country}</p>
                    {airQualityData.pm25 && (
                      <p>PM2.5: {airQualityData.pm25} μg/m³</p>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {loading && (
        <div className="map-loading">
          <p>Loading locations...</p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
