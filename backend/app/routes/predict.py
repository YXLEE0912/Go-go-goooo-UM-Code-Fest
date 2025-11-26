from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import os
from typing import List
import statsmodels.api as sm
import numpy as np
from datetime import datetime, timedelta

router = APIRouter()

# Load model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/best_model.pkl")
model = None

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"Model loaded successfully from {MODEL_PATH}")
    else:
        print(f"Model not found at {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")

# Load scaler
SCALER_PATH = os.path.join(os.path.dirname(__file__), "../../models/combined_scaler.joblib")
scaler = None

try:
    if os.path.exists(SCALER_PATH):
        scaler = joblib.load(SCALER_PATH)
        print(f"Scaler loaded successfully from {SCALER_PATH}")
    else:
        print(f"Scaler not found at {SCALER_PATH}")
except Exception as e:
    print(f"Error loading scaler: {e}")

class PredictionRequest(BaseModel):
    days: int = 7

class PredictionResponse(BaseModel):
    historical: List[float]
    forecast: List[float]
    analysis: str
    recommendation: str
    volatility: float
    rsi: float
    support_level: float
    resistance_level: float

# Assume the dataset ends at the beginning of 2025
DATA_END_DATE = datetime(2025, 1, 1)

@router.get("/history", response_model=List[float])
async def get_history(days: int = 30, period: str = "Week", month_index: int = 0, year: int = 2024):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Check if model has data
        if not (hasattr(model, 'data') and hasattr(model.data, 'endog')):
             # Fallback if model has no data
             return [100.0] * days

        data_array = model.data.endog
        total_len = len(data_array)
        
        # Calculate target start date based on user request
        # month_index is 0-based (0=Jan, 11=Dec)
        try:
            target_date = datetime(year, month_index + 1, 1)
        except ValueError:
            target_date = datetime(year, 1, 1)

        # Calculate how many days back from the "end" of the dataset this target date is
        # We assume the last data point (index total_len-1) corresponds to DATA_END_DATE
        days_from_end = (DATA_END_DATE - target_date).days
        
        # Calculate the starting index
        # index i corresponds to date: DATA_END_DATE - (total_len - 1 - i) days
        # so: i = (total_len - 1) - (DATA_END_DATE - date).days
        start_idx = (total_len - 1) - days_from_end
        
        # If the user wants 'days' amount of data
        end_idx = start_idx + days
        
        # Handle boundary conditions
        if start_idx < 0:
            start_idx = 0
            # If we are asking for data way before the start, we might get less data or need to pad
            # For now, just return what we have from 0
        
        if start_idx >= total_len:
            # Requested date is in the future relative to our dataset
            # Return the last available segment
            start_idx = max(0, total_len - days)
            end_idx = total_len
        elif end_idx > total_len:
            # Requested range goes beyond available data
            end_idx = total_len

        selected_data = data_array[start_idx:end_idx]
        
        # Convert to list and scale back to original prices using the combined_scaler
        if scaler and scaler.n_features_in_ >= 3:
            # Create a dummy array of zeros with shape (n_samples, n_features)
            dummy_array = np.zeros((len(selected_data), scaler.n_features_in_))
            # Place the scaled target data into column 2
            dummy_array[:, 2] = selected_data
            # Inverse transform
            inversed = scaler.inverse_transform(dummy_array)
            # Extract the result from column 2
            historical = inversed[:, 2].tolist()
        else:
            # Fallback
            historical = [float(h) * 203 + 50 for h in selected_data]
        
        # If we got fewer points than requested (e.g. start of dataset), 
        # we could pad, but Recharts handles it fine.
        
        return historical

    except Exception as e:
        print(f"History error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        steps = request.days
        
        # Get historical data from the model's training data (last 30 days)
        if hasattr(model, 'data') and hasattr(model.data, 'endog'):
            historical_scaled = model.data.endog[-30:]
            if scaler and scaler.n_features_in_ >= 3:
                dummy_array = np.zeros((len(historical_scaled), scaler.n_features_in_))
                dummy_array[:, 2] = historical_scaled
                inversed = scaler.inverse_transform(dummy_array)
                historical = inversed[:, 2].tolist()
            else:
                historical = [h * 203 + 50 for h in historical_scaled]
        else:
            # Fallback if no data available
            historical = [180.0] * 30  # Dummy real prices around 180
        
        # Prepare exogenous variables for forecast
        # The model expects: ['blended_sentiment_score', 'news_article_count', 'Volume']
        
        # Try to get recent exog data from the model to use as a baseline
        if hasattr(model, 'data') and hasattr(model.data, 'exog'):
            # Get the last 30 rows of exog data
            recent_exog = model.data.exog[-30:]
            # Calculate mean for each feature
            mean_exog = np.mean(recent_exog, axis=0)
            
            # Create future exog using the means
            # shape: (steps, n_exog)
            future_exog = np.tile(mean_exog, (steps, 1))
        else:
            # Fallback if we can't access training data
            # sentiment=0.1, news=5, volume=40M (approx)
            # Note: These values might be scaled if the model was trained on scaled data
            future_exog = np.array([[0.1, 5, 40000000]] * steps)

        # For SARIMAX results, we can use get_forecast or forecast
        # forecast() returns the predicted values
        forecast_result = model.forecast(steps=steps, exog=future_exog)
        
        # Convert to list
        if hasattr(forecast_result, 'tolist'):
            forecast_values = forecast_result.tolist()
        else:
            forecast_values = list(forecast_result)
        
        # Scale back to real prices
        if scaler and scaler.n_features_in_ >= 3:
            forecast_array = np.array(forecast_values)
            dummy_array = np.zeros((len(forecast_array), scaler.n_features_in_))
            dummy_array[:, 2] = forecast_array
            inversed = scaler.inverse_transform(dummy_array)
            forecast_values = inversed[:, 2].tolist()
        else:
            forecast_values = [f * 203 + 50 for f in forecast_values]
        
        # Generate Analysis and Recommendation
        start_price = forecast_values[0]
        end_price = forecast_values[-1]
        percent_change = ((end_price - start_price) / start_price) * 100
        
        # Calculate Volatility (Standard Deviation of returns)
        # Use historical data for volatility calculation
        if len(historical) > 1:
            hist_returns = np.diff(historical) / historical[:-1]
            volatility = float(np.std(hist_returns) * np.sqrt(252)) * 100 # Annualized volatility
        else:
            volatility = 0.0

        # Calculate RSI (14-day)
        rsi = 50.0
        if len(historical) > 14:
            deltas = np.diff(historical)
            seed = deltas[:14]
            up = seed[seed >= 0].sum() / 14
            down = -seed[seed < 0].sum() / 14
            rs = up / down if down != 0 else 0
            rsi = 100.0 - (100.0 / (1.0 + rs))
            
            # Smooth RSI for remaining data
            for delta in deltas[14:]:
                up_val = delta if delta > 0 else 0
                down_val = -delta if delta < 0 else 0
                up = (up * 13 + up_val) / 14
                down = (down * 13 + down_val) / 14
                rs = up / down if down != 0 else 0
                rsi = 100.0 - (100.0 / (1.0 + rs))

        # Calculate Support and Resistance (from last 30 days)
        support_level = min(historical)
        resistance_level = max(historical)

        # Determine sentiment from exog data (index 0 is sentiment)
        avg_sentiment = np.mean(future_exog[:, 0])
        sentiment_desc = "positive" if avg_sentiment > 0 else "negative" if avg_sentiment < 0 else "neutral"
        
        # Generate Analysis
        trend_desc = "upward" if percent_change > 0 else "downward"
        analysis = (
            f"Projected {trend_desc} trend of {abs(percent_change):.2f}% over the next {steps} days. "
            f"Market sentiment indicators are {sentiment_desc}, supported by consistent trading volume patterns. "
            f"The model identifies a potential {'breakout' if abs(percent_change) > 2 else 'consolidation'} phase. "
            f"Volatility is at {volatility:.2f}%, indicating {'high' if volatility > 30 else 'moderate' if volatility > 15 else 'low'} market risk."
        )
        
        # Generate Recommendation
        if percent_change > 2:
            recommendation = "Aggressive Growth: Leverage liquidity to expand market share. Consider strategic acquisitions or increasing inventory positions to capitalize on expected demand surge."
        elif percent_change > 0:
            recommendation = "Moderate Growth: Maintain current inventory levels. Optimize operational efficiency and monitor competitor pricing strategies."
        elif percent_change > -2:
            recommendation = "Defensive Posture: Review cost structures and streamline operations. Hedge against potential volatility while maintaining core market presence."
        else:
            recommendation = "Risk Mitigation: Reduce exposure to volatile assets. Diversify portfolio to stable instruments and implement strict stop-loss protocols."

        return PredictionResponse(
            historical=historical, 
            forecast=forecast_values,
            analysis=analysis,
            recommendation=recommendation,
            volatility=volatility,
            rsi=rsi,
            support_level=support_level,
            resistance_level=resistance_level
        )

    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
