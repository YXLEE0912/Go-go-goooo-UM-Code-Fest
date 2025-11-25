from fastapi import APIRouter, HTTPException
from typing import List, Dict
from ..utils.news import fetch_all_news

router = APIRouter()

@router.get("/news", response_model=List[Dict])
async def get_news():
    try:
        news = await fetch_all_news()
        return news
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
