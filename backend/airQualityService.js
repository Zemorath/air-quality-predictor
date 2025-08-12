const axios = require('axios');

class AirQualityService {
    constructor() {
        this.openaqBaseUrl = 'https://api.openaq.org/v2';
        this.waqiBaseUrl = 'https://api.waqi.info';
    }

    async getCurrentAirQuality(lat, lon) {
        try {
            // Try to get real data from OpenAQ API
            const openaqData = await this.getOpenAQData(lat, lon);
            if (openaqData) {
                return openaqData;
            }

            // Fallback to WAQI if available
            const waqiData = await this.getWAQIData(lat, lon);
            if (waqiData) {
                return waqiData;
            }

            // Generate mock data if APIs are not available
            return this.generateMockData(lat, lon);

        } catch (error) {
            console.error('Error fetching air quality data:', error.message);
            // Return mock data as fallback
            return this.generateMockData(lat, lon);
        }
    }

    async getOpenAQData(lat, lon) {
        try {
            const response = await axios.get(`${this.openaqBaseUrl}/latest`, {
                params: {
                    coordinates: `${lat},${lon}`,
                    radius: 25000, // 25km radius
                    limit: 1
                },
                timeout: 5000
            });

            const data = response.data?.results?.[0];
            if (!data) return null;

            // Convert OpenAQ format to our format
            const measurements = {};
            data.measurements?.forEach(m => {
                const param = m.parameter.toLowerCase();
                measurements[param] = m.value;
            });

            return {
                source: 'OpenAQ',
                location: data.location,
                city: data.city || 'Unknown',
                country: data.country,
                coordinates: data.coordinates,
                pm25: measurements.pm25 || null,
                pm10: measurements.pm10 || null,
                o3: measurements.o3 || null,
                no2: measurements.no2 || null,
                so2: measurements.so2 || null,
                co: measurements.co || null,
                aqi: this.calculateAQI(measurements),
                lastUpdated: data.date?.utc
            };

        } catch (error) {
            console.log('OpenAQ API not available:', error.message);
            return null;
        }
    }

    async getWAQIData(lat, lon) {
        try {
            const apiKey = process.env.WAQI_API_KEY;
            if (!apiKey) return null;

            const response = await axios.get(
                `${this.waqiBaseUrl}/feed/geo:${lat};${lon}/`,
                {
                    params: { token: apiKey },
                    timeout: 5000
                }
            );

            const data = response.data?.data;
            if (!data || data.aqi === '-') return null;

            const iaqi = data.iaqi || {};

            return {
                source: 'WAQI',
                location: data.city?.name || 'Unknown',
                city: data.city?.name || 'Unknown',
                country: 'Unknown',
                coordinates: { latitude: lat, longitude: lon },
                pm25: iaqi.pm25?.v || null,
                pm10: iaqi.pm10?.v || null,
                o3: iaqi.o3?.v || null,
                no2: iaqi.no2?.v || null,
                so2: iaqi.so2?.v || null,
                co: iaqi.co?.v || null,
                aqi: parseInt(data.aqi),
                lastUpdated: data.time?.iso
            };

        } catch (error) {
            console.log('WAQI API not available:', error.message);
            return null;
        }
    }

    generateMockData(lat, lon) {
        // Generate realistic mock data based on location
        const baseAQI = this.getBaseAQIForLocation(lat, lon);
        const variation = (Math.random() - 0.5) * 20; // ±10 variation
        const aqi = Math.max(10, Math.min(300, Math.round(baseAQI + variation)));

        // Generate corresponding pollutant values
        const pm25 = Math.max(1, aqi * 0.3 + (Math.random() - 0.5) * 10);
        const pm10 = pm25 * 1.5 + (Math.random() - 0.5) * 5;
        const o3 = Math.max(10, aqi * 0.4 + (Math.random() - 0.5) * 15);
        const no2 = Math.max(5, aqi * 0.25 + (Math.random() - 0.5) * 8);
        const so2 = Math.max(1, aqi * 0.1 + (Math.random() - 0.5) * 3);
        const co = Math.max(0.1, aqi * 0.02 + (Math.random() - 0.5) * 0.5);

        return {
            source: 'Mock Data',
            location: this.getCityNameFromCoords(lat, lon),
            city: this.getCityNameFromCoords(lat, lon),
            country: this.getCountryFromCoords(lat, lon),
            coordinates: { latitude: lat, longitude: lon },
            pm25: Math.round(pm25 * 10) / 10,
            pm10: Math.round(pm10 * 10) / 10,
            o3: Math.round(o3 * 10) / 10,
            no2: Math.round(no2 * 10) / 10,
            so2: Math.round(so2 * 10) / 10,
            co: Math.round(co * 100) / 100,
            aqi: aqi,
            lastUpdated: new Date().toISOString(),
            temperature: Math.round((15 + Math.random() * 20) * 10) / 10,
            humidity: Math.round((40 + Math.random() * 40) * 10) / 10,
            wind_speed: Math.round((3 + Math.random() * 10) * 10) / 10,
            pressure: Math.round((1000 + Math.random() * 30) * 100) / 100
        };
    }

    getBaseAQIForLocation(lat, lon) {
        // Assign different base AQI values based on geographic regions
        // This is a simplified approach for demo purposes
        
        // High pollution areas (industrial cities, developing countries)
        if (
            (lat > 25 && lat < 35 && lon > 75 && lon < 85) || // India region
            (lat > 35 && lat < 45 && lon > 110 && lon < 125) || // China region
            (lat > 19 && lat < 20 && lon > -100 && lon < -98) // Mexico City
        ) {
            return 120 + Math.random() * 60; // 120-180
        }
        
        // Moderate pollution areas (developed cities)
        if (
            (lat > 40 && lat < 42 && lon > -75 && lon < -73) || // New York area
            (lat > 33 && lat < 35 && lon > -119 && lon < -117) || // LA area
            (lat > 51 && lat < 52 && lon > -1 && lon < 1) // London area
        ) {
            return 60 + Math.random() * 40; // 60-100
        }
        
        // Clean areas (rural, coastal)
        return 30 + Math.random() * 30; // 30-60
    }

    getCityNameFromCoords(lat, lon) {
        // Simple coordinate to city mapping for demo
        const cities = {
            '40.7,-74.0': 'New York',
            '34.0,-118.2': 'Los Angeles',
            '51.5,-0.1': 'London',
            '39.9,116.4': 'Beijing',
            '35.7,139.7': 'Tokyo',
            '28.7,77.1': 'Delhi',
            '48.9,2.4': 'Paris',
            '-33.9,151.2': 'Sydney'
        };

        const key = `${Math.round(lat * 10) / 10},${Math.round(lon * 10) / 10}`;
        return cities[key] || `Location ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }

    getCountryFromCoords(lat, lon) {
        // Simple coordinate to country mapping
        if (lat > 24 && lat < 50 && lon > -125 && lon < -66) return 'USA';
        if (lat > 49 && lat < 61 && lon > -8 && lon < 2) return 'UK';
        if (lat > 35 && lat < 54 && lon > 73 && lon < 135) return 'China';
        if (lat > 30 && lat < 46 && lon > 129 && lon < 146) return 'Japan';
        if (lat > 6 && lat < 37 && lon > 68 && lon < 97) return 'India';
        if (lat > 41 && lat < 51 && lon > -5 && lon < 10) return 'France';
        if (lat > -44 && lat < -10 && lon > 113 && lon < 154) return 'Australia';
        return 'Unknown';
    }

    calculateAQI(measurements) {
        // Simple AQI calculation based on PM2.5 (US EPA standard)
        const pm25 = measurements.pm25;
        if (!pm25) return Math.round(50 + Math.random() * 50);

        if (pm25 <= 12.0) return Math.round((50 / 12.0) * pm25);
        if (pm25 <= 35.4) return Math.round(50 + ((100 - 50) / (35.4 - 12.1)) * (pm25 - 12.1));
        if (pm25 <= 55.4) return Math.round(100 + ((150 - 100) / (55.4 - 35.5)) * (pm25 - 35.5));
        if (pm25 <= 150.4) return Math.round(150 + ((200 - 150) / (150.4 - 55.5)) * (pm25 - 55.5));
        if (pm25 <= 250.4) return Math.round(200 + ((300 - 200) / (250.4 - 150.5)) * (pm25 - 150.5));
        return Math.round(300 + ((400 - 300) / (350.4 - 250.5)) * (pm25 - 250.5));
    }

    getAQICategory(aqi) {
        if (aqi <= 50) return { category: "Good", emoji: "🟢", color: "#00e400" };
        if (aqi <= 100) return { category: "Moderate", emoji: "🟡", color: "#ffff00" };
        if (aqi <= 150) return { category: "Unhealthy for Sensitive", emoji: "🟠", color: "#ff7e00" };
        if (aqi <= 200) return { category: "Unhealthy", emoji: "🔴", color: "#ff0000" };
        if (aqi <= 300) return { category: "Very Unhealthy", emoji: "🟣", color: "#8f3f97" };
        return { category: "Hazardous", emoji: "🟤", color: "#7e0023" };
    }
}

module.exports = AirQualityService;
