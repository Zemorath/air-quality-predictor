const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const Database = require('./database');
const AirQualityService = require('./airQualityService');
const MLService = require('./mlService');

const app = express();
const port = process.env.PORT || 5000;

// Initialize services
const database = new Database();
const airQualityService = new AirQualityService();
const mlService = new MLService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize database
async function initializeDatabase() {
    try {
        await database.init();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get current air quality for coordinates
app.get('/api/air-quality/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }

        // Get current air quality data
        const airQualityData = await airQualityService.getCurrentAirQuality(latitude, longitude);
        
        // Get or create location in database
        let location = await database.getLocationByCoords(latitude, longitude);
        if (!location) {
            await database.addLocation(
                airQualityData.city || 'Unknown Location',
                latitude,
                longitude,
                airQualityData.country
            );
            location = await database.getLocationByCoords(latitude, longitude);
        }

        // Store air quality data if we have a location
        if (location && airQualityData.aqi) {
            const today = new Date().toISOString().split('T')[0];
            await database.addAirQualityData({
                location_id: location.id,
                date: today,
                pm25: airQualityData.pm25,
                pm10: airQualityData.pm10,
                o3: airQualityData.o3,
                no2: airQualityData.no2,
                so2: airQualityData.so2,
                co: airQualityData.co,
                temperature: airQualityData.temperature,
                humidity: airQualityData.humidity,
                wind_speed: airQualityData.wind_speed,
                pressure: airQualityData.pressure,
                aqi: airQualityData.aqi
            });
        }

        // Add category information
        const categoryInfo = airQualityService.getAQICategory(airQualityData.aqi);
        
        res.json({
            ...airQualityData,
            ...categoryInfo,
            location_id: location?.id
        });

    } catch (error) {
        console.error('Error fetching air quality:', error);
        res.status(500).json({ error: 'Failed to fetch air quality data' });
    }
});

// Get air quality prediction
app.post('/api/predict', async (req, res) => {
    try {
        const { latitude, longitude, currentData } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        // Get current air quality if not provided
        let inputData = currentData;
        if (!inputData) {
            inputData = await airQualityService.getCurrentAirQuality(latitude, longitude);
        }

        // Get prediction from ML service
        const predictionResult = await mlService.predictAQI(inputData);

        // Get or create location
        let location = await database.getLocationByCoords(latitude, longitude);
        if (!location) {
            await database.addLocation(
                inputData.city || 'Unknown Location',
                latitude,
                longitude,
                inputData.country
            );
            location = await database.getLocationByCoords(latitude, longitude);
        }

        // Store prediction in database
        if (location && predictionResult.success) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const predictionDate = tomorrow.toISOString().split('T')[0];

            await database.addPrediction(
                location.id,
                predictionDate,
                predictionResult.prediction.predicted_aqi,
                predictionResult.prediction.category,
                predictionResult.inputFeatures
            );
        }

        res.json({
            ...predictionResult,
            location_id: location?.id,
            prediction_date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]
        });

    } catch (error) {
        console.error('Error making prediction:', error);
        res.status(500).json({ error: 'Failed to generate prediction' });
    }
});

// Get all locations
app.get('/api/locations', async (req, res) => {
    try {
        const locations = await database.getLocations();
        res.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

// Add a new location
app.post('/api/locations', async (req, res) => {
    try {
        const { name, latitude, longitude, country } = req.body;

        if (!name || !latitude || !longitude) {
            return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
        }

        const result = await database.addLocation(name, latitude, longitude, country);
        
        if (result.changes > 0) {
            const location = await database.getLocationById(result.id);
            res.status(201).json(location);
        } else {
            // Location already exists
            const existingLocation = await database.getLocationByCoords(latitude, longitude);
            res.json(existingLocation);
        }

    } catch (error) {
        console.error('Error adding location:', error);
        res.status(500).json({ error: 'Failed to add location' });
    }
});

// Get historical data for a location
app.get('/api/locations/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 30 } = req.query;

        const history = await database.getAirQualityData(id, parseInt(limit));
        res.json(history);

    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
});

// Get predictions for a location
app.get('/api/locations/:id/predictions', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 10 } = req.query;

        const predictions = await database.getPredictions(id, parseInt(limit));
        
        // Parse input_features JSON
        const parsedPredictions = predictions.map(pred => ({
            ...pred,
            input_features: pred.input_features ? JSON.parse(pred.input_features) : null
        }));

        res.json(parsedPredictions);

    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(port, () => {
        console.log(`🚀 Air Quality Predictor API running on port ${port}`);
        console.log(`📍 Health check: http://localhost:${port}/api/health`);
    });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

startServer().catch(console.error);

module.exports = app;
