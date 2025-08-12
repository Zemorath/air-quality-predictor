import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const PredictionDisplay = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="prediction-card loading">
        <div className="loading-content">
          <TrendingUp className="loading-icon" />
          <div className="loading-text">Generating ML prediction...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-card error">
        <div className="error-content">
          <AlertTriangle className="error-icon" />
          <h3>Prediction Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="prediction-card empty">
        <div className="empty-content">
          <TrendingUp className="empty-icon" />
          <p>Prediction will appear here after selecting a location</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prediction-card">
      {/* Prediction Status */}
      <div className="prediction-status">
        {data.success ? (
          <CheckCircle className="status-icon success" />
        ) : (
          <AlertTriangle className="status-icon warning" />
        )}
        <span className="status-text">
          {data.success ? 'ML Prediction' : 'Fallback Prediction'}
          {data.fallback && ' (Using fallback method)'}
        </span>
      </div>

      {/* Main Prediction Display */}
      <div className="prediction-main" style={{ backgroundColor: data.color }}>
        <div className="prediction-content">
          <div className="prediction-number">{Math.round(data.predicted_aqi)}</div>
          <div className="prediction-category">
            <span className="prediction-emoji">{data.emoji}</span>
            <span className="prediction-text">{data.category}</span>
          </div>
        </div>
      </div>

      {/* Prediction Details */}
      <div className="prediction-details">
        <h4>Future Air Quality Forecast</h4>
        <p>
          Based on current conditions and historical patterns, the predicted AQI is{' '}
          <strong>{Math.round(data.predicted_aqi)}</strong>, indicating{' '}
          <strong>{data.category.toLowerCase()}</strong> air quality.
        </p>
        
        {data.prediction_date && (
          <p className="prediction-date">
            Prediction for: {new Date(data.prediction_date).toLocaleString()}
          </p>
        )}
      </div>

      {/* Error Information */}
      {data.error && (
        <div className="prediction-error">
          <AlertTriangle className="error-icon" />
          <p>Note: {data.error}</p>
        </div>
      )}

      {/* Model Information */}
      <div className="model-info">
        <h5>Model Information</h5>
        <p>
          {data.success 
            ? 'Prediction generated using Random Forest machine learning model trained on historical air quality data.'
            : 'Prediction generated using statistical fallback method based on current conditions.'
          }
        </p>
      </div>
    </div>
  );
};

export default PredictionDisplay;
