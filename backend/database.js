const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'database', 'air_quality.db');
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    resolve();
                }
            });
        });
    }

    async init() {
        if (!this.db) {
            await this.connect();
        }

        // Read and execute schema
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split schema into individual statements
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await this.run(statement);
            }
        }
        
        console.log('Database initialized successfully');
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Location methods
    async getLocations() {
        return this.all('SELECT * FROM locations ORDER BY name');
    }

    async getLocationById(id) {
        return this.get('SELECT * FROM locations WHERE id = ?', [id]);
    }

    async getLocationByCoords(lat, lon) {
        return this.get(
            'SELECT * FROM locations WHERE ABS(latitude - ?) < 0.01 AND ABS(longitude - ?) < 0.01',
            [lat, lon]
        );
    }

    async addLocation(name, latitude, longitude, country = null) {
        return this.run(
            'INSERT OR IGNORE INTO locations (name, latitude, longitude, country) VALUES (?, ?, ?, ?)',
            [name, latitude, longitude, country]
        );
    }

    // Air quality data methods
    async getAirQualityData(locationId, limit = 30) {
        return this.all(
            'SELECT * FROM air_quality_data WHERE location_id = ? ORDER BY date DESC LIMIT ?',
            [locationId, limit]
        );
    }

    async addAirQualityData(data) {
        const {
            location_id, date, pm25, pm10, o3, no2, so2, co,
            temperature, humidity, wind_speed, pressure, aqi
        } = data;

        return this.run(`
            INSERT OR REPLACE INTO air_quality_data 
            (location_id, date, pm25, pm10, o3, no2, so2, co, temperature, humidity, wind_speed, pressure, aqi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [location_id, date, pm25, pm10, o3, no2, so2, co, temperature, humidity, wind_speed, pressure, aqi]);
    }

    // Prediction methods
    async addPrediction(locationId, predictionDate, predictedAqi, category, inputFeatures, confidenceScore = null) {
        return this.run(`
            INSERT INTO predictions 
            (location_id, prediction_date, predicted_aqi, category, input_features, confidence_score)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [locationId, predictionDate, predictedAqi, category, JSON.stringify(inputFeatures), confidenceScore]);
    }

    async getPredictions(locationId, limit = 10) {
        return this.all(
            'SELECT * FROM predictions WHERE location_id = ? ORDER BY created_at DESC LIMIT ?',
            [locationId, limit]
        );
    }
}

module.exports = Database;
