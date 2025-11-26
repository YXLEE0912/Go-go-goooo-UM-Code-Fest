from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import joblib
import os
from typing import List, Optional
import statsmodels.api as sm
import numpy as np
from datetime import datetime, timedelta
import google.generativeai as genai
import json
import re
from ..routes.auth import get_current_user
from ..models.user import User
from ..utils.email import send_price_alert_email
from ..database import get_database
from pymongo.database import Database

router = APIRouter()

class StrategicInsights(BaseModel):
    allocation: dict
    capacity_planning: str
    risk_mitigation: str
    scenarios: dict

class PredictionResponse(BaseModel):
    historical: List[float]
    forecast: List[float]
    analysis: str
    recommendation: str
    volatility: float
    rsi: float
    support_level: float
    resistance_level: float
    alerts: List[dict]
    strategic_insights: Optional[StrategicInsights] = None

# Initialize Gemini
def get_gemini_analysis(forecast_change: float, volatility: float, rsi: float, recommendation: str) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        return {"analysis": "API Key missing for analysis.", "insights": None}
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        You are the Chief Strategy Officer for NVIDIA.
        Based on the following AI forecast metrics, provide a strategic internal report in JSON format.
        
        Metrics:
        - 7-Day Price Forecast Change: {forecast_change:.2f}%
        - Annualized Volatility: {volatility:.2f}
        - RSI (14-day): {rsi:.2f}
        - Strategic Recommendation: {recommendation}
        
        Return ONLY a raw JSON object (no markdown formatting) with the following structure:
        {{
            "analysis": "A concise 2-sentence executive summary of the market situation.",
            "insights": {{
                "allocation": {{
                    "AI R&D": <integer percentage>,
                    "Supply Chain": <integer percentage>,
                    "Data Center": <integer percentage>,
                    "Partnerships": <integer percentage>
                }},
                "capacity_planning": "Specific actionable advice on manufacturing/wafer capacity (e.g., 'Increase H200 output by 15%').",
                "risk_mitigation": "Specific risk advice based on volatility (e.g., 'If volatility > 40%, hedge inventory').",
                "scenarios": {{
                    "Scenario A (Moderate)": "Strategic focus for moderate growth.",
                    "Scenario B (High Growth)": "Strategic focus for high growth/demand spike."
                }}
            }}
        }}
        Ensure allocation percentages sum to 100.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        print(f"Gemini Raw Response: {text}") # Debug logging

        # Robust JSON extraction
        try:
            # Find the first '{' and the last '}'
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx : end_idx + 1]
                return json.loads(json_str)
            else:
                print("No JSON object found in response")
                return {"analysis": "Analysis format error.", "insights": None}
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            return {"analysis": "Analysis parsing error.", "insights": None}
            
    except Exception as e:
        print(f"Gemini analysis error: {e}")
        return {"analysis": "Analysis unavailable due to service error.", "insights": None}

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
async def predict(request: PredictionRequest, current_user: User = Depends(get_current_user), db: Database = Depends(get_database)):
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

        # === ALERT LOGIC ===
        alerts = []
        baseline = historical[-1]  # last historical price
        email_sent = False # Flag to prevent spamming multiple emails for one forecast

        for i, val in enumerate(forecast_values, start=1):
            pct_change = ((val - baseline) / baseline) * 100
            if pct_change <= -7:
                signal = "critical alert"
                # Trigger email if user has price alerts enabled and we haven't sent one yet
                if current_user.settings.priceAlerts and not email_sent:
                    threshold_price = baseline * 0.93 # 7% drop threshold
                    
                    # Send Email
                    await send_price_alert_email(
                        current_user.email, 
                        "NVIDIA (Forecast)", 
                        val, 
                        threshold_price
                    )
                    
                    # Save to Database
                    try:
                        notification_doc = {
                            "user_id": current_user.id,
                            "message": f"Critical Forecast Alert: Price expected to drop to ${val:.2f} (Day {i})",
                            "type": "critical",
                            "read": False,
                            "timestamp": datetime.now()
                        }
                        db["notifications"].insert_one(notification_doc)
                    except Exception as e:
                        print(f"Error saving notification: {e}")

                    email_sent = True
            elif pct_change <= -5:
                signal = "normal alert"
            else:
                signal = "no alert"
            alerts.append({
                "day": i,
                "price": val,
                "pct_change": round(pct_change, 2),
                "signal": signal
            })

        # === TECHNICAL ANALYSIS ===
        # Convert historical to numpy array for calculations
        prices = np.array(historical)
        
        # 1. Volatility (Annualized)
        # Calculate daily returns
        if len(prices) > 1:
            returns = np.diff(prices) / prices[:-1]
            # Std dev of returns * sqrt(252 trading days)
            volatility = np.std(returns) * np.sqrt(252)
        else:
            volatility = 0.0
        
        # 2. RSI (14-day)
        if len(prices) > 14:
            deltas = np.diff(prices)
            seed = deltas[:14+1]
            up = seed[seed >= 0].sum()/14
            down = -seed[seed < 0].sum()/14
            if down == 0:
                rsi = 100.0
            else:
                rs = up/down
                rsi = 100. - 100./(1. + rs)
            
            # Calculate for the rest
            for i in range(14, len(prices)-1):
                delta = deltas[i]
                if delta > 0:
                    upval = delta
                    downval = 0.
                else:
                    upval = 0.
                    downval = -delta
                
                up = (up*(13) + upval)/14
                down = (down*(13) + downval)/14
                if down == 0:
                    rsi = 100.0
                else:
                    rs = up/down
                    rsi = 100. - 100./(1. + rs)
        else:
            rsi = 50.0 # Default neutral
            
        # 3. Support & Resistance (Simple: Min/Max of last 30 days)
        support_level = np.min(prices) if len(prices) > 0 else 0.0
        resistance_level = np.max(prices) if len(prices) > 0 else 0.0

        # === STRATEGIC ANALYSIS ===
        # Calculate predicted change
        start_price = forecast_values[0]
        end_price = forecast_values[-1]
        pct_change_forecast = ((end_price - start_price) / start_price) * 100
        
        if pct_change_forecast > 2.0:
            recommendation = "Aggressive Expansion"
        elif pct_change_forecast > 0.5:
            recommendation = "Growth Focus"
        elif pct_change_forecast < -2.0:
            recommendation = "Defensive Restructuring"
        elif pct_change_forecast < -0.5:
            recommendation = "Cost Optimization"
        else:
            recommendation = "Stability Maintenance"
            
        # Generate AI analysis using Gemini
        gemini_result = get_gemini_analysis(pct_change_forecast, float(volatility), float(rsi), recommendation)
        analysis = gemini_result.get("analysis", "Analysis unavailable.")
        insights = gemini_result.get("insights")

        # Return combined JSON
        return {
            "historical": historical,
            "forecast": forecast_values,
            "analysis": analysis,
            "recommendation": recommendation,
            "volatility": float(volatility),
            "rsi": float(rsi),
            "support_level": float(support_level),
            "resistance_level": float(resistance_level),
            "alerts": alerts,
            "strategic_insights": insights
        }

    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))