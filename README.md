# Air Quality Predictor 🌍

A full-stack web application that displays air quality data on a world map and predicts future Air Quality Index (AQI) using machine learning.

## Features

- 🗺️ Interactive world map with real-time air quality data
- 🔍 Search for specific locations
- 📊 Current AQI display with color-coded categories
- 🤖 ML-powered AQI prediction for next day
- 📈 Historical data visualization
- 💾 SQLite database for data storage

## Tech Stack

- **Frontend**: React with Leaflet for mapping
- **Backend**: Node.js with Express
- **ML Model**: Python with scikit-learn
- **Database**: SQLite
- **APIs**: OpenAQ for real-time air quality data

## Project Structure

```
air-quality-predictor/
├── backend/                 # Node.js Express server
├── frontend/               # React application
├── ml-model/              # Python ML scripts
├── database/              # SQLite database and schemas
├── data/                  # Sample datasets
└── README.md
```

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- npm or yarn

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd air-quality-predictor
   ```

2. **Install Python dependencies**
   ```bash
   cd ml-model
   pip install -r requirements.txt
   cd ..
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys (optional for demo)
   ```

6. **Initialize the database**
   ```bash
   cd backend
   npm run init-db
   cd ..
   ```

7. **Train the ML model**
   ```bash
   cd ml-model
   python train_model.py
   cd ..
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend (in a new terminal)**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the application**
   Open http://localhost:3000 in your browser

## API Endpoints

- `GET /api/air-quality/:lat/:lon` - Get current air quality for coordinates
- `POST /api/predict` - Get AQI prediction for location
- `GET /api/locations` - Get saved locations
- `POST /api/locations` - Save a new location

## AQI Categories

- 🟢 **Good (0-50)**: Air quality is satisfactory
- 🟡 **Moderate (51-100)**: Air quality is acceptable
- 🟠 **Unhealthy for Sensitive (101-150)**: Sensitive individuals may experience problems
- 🔴 **Unhealthy (151-200)**: Everyone may experience problems
- 🟣 **Very Unhealthy (201-300)**: Health alert for everyone
- 🟤 **Hazardous (301+)**: Emergency conditions

## License

MIT License