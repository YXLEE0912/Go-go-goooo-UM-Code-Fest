from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
import time
import datetime
import uuid
import google.generativeai as genai
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

        system_prompt = f"""You are an expert R&D investment advisor for semiconductor companies (specifically NVIDIA).
Use the news context below to provide actionable recommendations.
Focus on: emerging technologies, competitive positioning, market opportunities, risk assessment.
Cite news snippets using [number] format if relevant.

News Context:
{context_text}
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
