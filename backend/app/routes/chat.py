from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
import time
import datetime
import uuid
import google.generativeai as genai
import joblib
import numpy as np
import statsmodels.api as sm
from ..utils.news import fetch_all_news
from ..routes.auth import get_current_user
from ..models.user import User, ChatMessage, ChatSession
from ..database import get_database
from pymongo.collection import Collection
from pymongo.database import Database

router = APIRouter()

class ChatRequestMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: List[ChatRequestMessage] = []

class ChatResponse(BaseModel):
    response: str
    session_id: str
    sources: Optional[List[dict]] = None

def get_chat_collection(db: Database) -> Collection:
    return db["chat_sessions"]

# Initialize Gemini client
def get_gemini_client():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Google API key not configured")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-flash')

# Load model and scaler for chat context
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/best_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "../../models/combined_scaler.joblib")

def get_ai_forecast_context():
    try:
        if not os.path.exists(MODEL_PATH):
            return "AI Forecast model is currently unavailable."
            
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH) if os.path.exists(SCALER_PATH) else None
        
        # Generate 7-day forecast
        steps = 7
        
        # Prepare exogenous variables (using mean of recent data or defaults)
        if hasattr(model, 'data') and hasattr(model.data, 'exog'):
            recent_exog = model.data.exog[-30:]
            mean_exog = np.mean(recent_exog, axis=0)
            future_exog = np.tile(mean_exog, (steps, 1))
        else:
            # Fallback: sentiment=0.1, news=5, volume=40M
            future_exog = np.array([[0.1, 5, 40000000]] * steps)
            
        forecast_result = model.forecast(steps=steps, exog=future_exog)
        
        if hasattr(forecast_result, 'tolist'):
            forecast_values = forecast_result.tolist()
        else:
            forecast_values = list(forecast_result)
            
        # Scale back
        if scaler and hasattr(scaler, 'n_features_in_') and scaler.n_features_in_ >= 3:
            forecast_array = np.array(forecast_values)
            dummy_array = np.zeros((len(forecast_array), scaler.n_features_in_))
            dummy_array[:, 2] = forecast_array
            inversed = scaler.inverse_transform(dummy_array)
            prices = inversed[:, 2].tolist()
        else:
            prices = [f * 203 + 50 for f in forecast_values]
            
        start_price = prices[0]
        end_price = prices[-1]
        trend = "UPWARD" if end_price > start_price else "DOWNWARD"
        percent_change = ((end_price - start_price) / start_price) * 100
        
        return f"""
AI Price Forecast (Next 7 Days):
- Trend: {trend}
- Current Projected Price: ${start_price:.2f}
- 7-Day Target: ${end_price:.2f}
- Expected Change: {percent_change:.2f}%
- Daily Projections: {[f'${p:.2f}' for p in prices]}
"""
    except Exception as e:
        print(f"Error generating forecast context: {e}")
        return "AI Forecast data is currently unavailable due to an internal error."

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    try:
        # print(f"--- Start Chat Request for user: {current_user.email} ---")
        
        model = get_gemini_client()
        
        # Fetch news context
        news = await fetch_all_news()
        
        context_text = "No recent news available."
        if news:
            context_text = "\n".join([
                f"[{i+1}] {n['title']}: {n['summary']} ({n['provider']})"
                for i, n in enumerate(news)
            ])
        else:
            context_text = "News fetching is currently unavailable. I'll provide general advice."

        # Get AI forecast context
        forecast_context = get_ai_forecast_context()

        system_prompt = f"""You are an expert R&D investment advisor for semiconductor companies (specifically NVIDIA).
Use the news context and AI forecast below to provide actionable recommendations.
Focus on: emerging technologies, competitive positioning, market opportunities, risk assessment.
Cite news snippets using [number] format if relevant.

News Context:
{context_text}

AI Forecast:
{forecast_context}
"""

        # Build conversation history for Gemini
        conversation = [system_prompt]
        
        # Add history (limit to last 6 messages to save tokens)
        for msg in request.history[-6:]:
            if msg.role == "user":
                conversation.append(f"User: {msg.content}")
            elif msg.role == "assistant":
                conversation.append(f"Assistant: {msg.content}")
            
        # Add current user message
        conversation.append(f"User: {request.message}")

        # Combine into a single prompt
        full_prompt = "\n".join(conversation)

        response = model.generate_content(full_prompt)
        answer = response.text
        
        # Determine session ID
        session_id = request.session_id
        if not session_id:
            session_id = str(uuid.uuid4())

        # Create message objects
        user_message = ChatMessage(
            role="user",
            content=request.message,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
        ai_message = ChatMessage(
            role="assistant",
            content=answer,
            timestamp=datetime.datetime.utcnow().isoformat(),
            sources=news
        )
        
        # Save to database (upsert session)
        chat_collection = get_chat_collection(db)
        chat_collection.update_one(
            {"session_id": session_id, "user_id": current_user.id},
            {
                "$setOnInsert": {"user_id": current_user.id, "session_id": session_id},
                "$push": {"messages": {"$each": [user_message.dict(), ai_message.dict()]}}
            },
            upsert=True
        )
        
        return ChatResponse(
            response=answer,
            session_id=session_id,
            sources=news if news else None
        )

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/history", response_model=List[ChatSession])
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    try:
        chat_collection = get_chat_collection(db)
        sessions = list(chat_collection.find({"user_id": current_user.id}))
        return [ChatSession(**session) for session in sessions]
    except Exception as e:
        print(f"Get chat history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
