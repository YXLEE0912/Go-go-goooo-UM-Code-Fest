from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
import time
import google.generativeai as genai
from ..utils.news import fetch_all_news
from ..routes.auth import get_current_user
from ..models.user import User

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[dict]] = None

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
    current_user: User = Depends(get_current_user)
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
        
        return ChatResponse(
            response=answer,
            sources=news if news else None
        )

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
