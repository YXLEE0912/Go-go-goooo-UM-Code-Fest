from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
from openai import OpenAI
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

# Initialize OpenAI client
# Note: In production, you might want to initialize this once in main.py or a dependency
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    return OpenAI(api_key=api_key)

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        client = get_openai_client()
        
        # Fetch news context
        news = await fetch_all_news()
        
        context_text = "No recent news available."
        if news:
            context_text = "\n".join([
                f"[{i+1}] {n['title']}: {n['summary']} ({n['provider']})"
                for i, n in enumerate(news)
            ])

        system_prompt = f"""You are an expert R&D investment advisor for semiconductor companies (specifically NVIDIA).
Use the news context below to provide actionable recommendations.
Focus on: emerging technologies, competitive positioning, market opportunities, risk assessment.
Cite news snippets using [number] format if relevant.

News Context:
{context_text}
"""

        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add history (limit to last 6 messages to save tokens)
        for msg in request.history[-6:]:
            messages.append({"role": msg.role, "content": msg.content})
            
        # Add current user message
        messages.append({"role": "user", "content": request.message})

        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )

        answer = completion.choices[0].message.content
        
        return ChatResponse(
            response=answer,
            sources=news if news else None
        )

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
