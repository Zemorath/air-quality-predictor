import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

const LocationSearch = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Simple geocoding function using a public API
  const searchLocation = async (searchQuery) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);
        return { lat, lon, display_name: location.display_name };
      }
      
      throw new Error('Location not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const location = await searchLocation(query);
      onLocationSelect(location.lat, location.lon);
      setQuery(''); // Clear the search after successful search
    } catch (error) {
      alert('Location not found. Please try a different search term.');
    } finally {
      setSearching(false);
    }
  };

  const handleQuickLocation = (lat, lon, name) => {
    onLocationSelect(lat, lon);
  };

  const quickLocations = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
    { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  ];

  return (
    <div className="location-search">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <Search className="search-input-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a city or location..."
            className="search-input"
            disabled={searching}
          />
          <button
            type="submit"
            disabled={!query.trim() || searching}
            className="search-button"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      <div className="quick-locations">
        <h4 className="quick-locations-title">
          <MapPin className="quick-locations-icon" />
          Quick Locations
        </h4>
        <div className="quick-locations-grid">
          {quickLocations.map((location) => (
            <button
              key={location.name}
              onClick={() => handleQuickLocation(location.lat, location.lon, location.name)}
              className="quick-location-button"
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationSearch;
