const { spawn } = require('child_process');
const path = require('path');

class MLService {
    constructor() {
        this.pythonPath = 'python3'; // or 'python' depending on system
        this.scriptPath = path.join(__dirname, '..', 'ml-model', 'predict.py');
    }

    async predict(inputData) {
        return new Promise((resolve, reject) => {
            const jsonInput = JSON.stringify(inputData);
            
            const pythonProcess = spawn(this.pythonPath, [this.scriptPath, jsonInput]);
            
            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output.trim());
                        resolve(result);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse ML output: ${parseError.message}`));
                    }
                } else {
                    reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }

    async predictAQI(locationData) {
        try {
            const inputFeatures = {
                pm25: locationData.pm25 || 15.0,
                pm10: locationData.pm10 || 25.0,
                o3: locationData.o3 || 40.0,
                no2: locationData.no2 || 30.0,
                so2: locationData.so2 || 8.0,
                co: locationData.co || 1.0,
                temperature: locationData.temperature || 20.0,
                humidity: locationData.humidity || 60.0,
                wind_speed: locationData.wind_speed || 8.0,
                pressure: locationData.pressure || 1013.25,
                latitude: locationData.coordinates?.latitude || locationData.latitude || 0.0,
                longitude: locationData.coordinates?.longitude || locationData.longitude || 0.0
            };

            const prediction = await this.predict(inputFeatures);
            
            return {
                success: true,
                prediction: prediction,
                inputFeatures: inputFeatures
            };

        } catch (error) {
            console.error('ML Prediction Error:', error.message);
            
            // Fallback prediction if ML model fails
            const fallbackAQI = this.calculateFallbackAQI(locationData);
            
            return {
                success: false,
                error: error.message,
                fallback: true,
                prediction: {
                    predicted_aqi: fallbackAQI.aqi,
                    category: fallbackAQI.category,
                    emoji: fallbackAQI.emoji,
                    color: fallbackAQI.color
                }
            };
        }
    }

    calculateFallbackAQI(locationData) {
        // Simple fallback calculation based on PM2.5 if available
        let aqi = 50; // default moderate
        
        if (locationData.pm25) {
            if (locationData.pm25 <= 12) aqi = 25;
            else if (locationData.pm25 <= 35) aqi = 75;
            else if (locationData.pm25 <= 55) aqi = 125;
            else if (locationData.pm25 <= 150) aqi = 175;
            else aqi = 225;
        } else if (locationData.aqi) {
            aqi = locationData.aqi;
        }

        // Add some variation for tomorrow's prediction
        aqi = Math.max(10, Math.min(300, aqi + (Math.random() - 0.5) * 20));

        return this.getAQICategory(Math.round(aqi));
    }

    getAQICategory(aqi) {
        if (aqi <= 50) {
            return { aqi, category: "Good", emoji: "🟢", color: "#00e400" };
        } else if (aqi <= 100) {
            return { aqi, category: "Moderate", emoji: "🟡", color: "#ffff00" };
        } else if (aqi <= 150) {
            return { aqi, category: "Unhealthy for Sensitive", emoji: "🟠", color: "#ff7e00" };
        } else if (aqi <= 200) {
            return { aqi, category: "Unhealthy", emoji: "🔴", color: "#ff0000" };
        } else if (aqi <= 300) {
            return { aqi, category: "Very Unhealthy", emoji: "🟣", color: "#8f3f97" };
        } else {
            return { aqi, category: "Hazardous", emoji: "🟤", color: "#7e0023" };
        }
    }
}

module.exports = MLService;
