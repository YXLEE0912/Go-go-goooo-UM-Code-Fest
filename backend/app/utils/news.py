import os
import requests
import feedparser
from typing import List, Dict

async def get_yahoo_news(limit: int = 3) -> List[Dict]:
    api_key = os.getenv("YAHOO_API_KEY")
    api_host = "apidojo-yahoo-finance-v1.p.rapidapi.com"
    
    if not api_key:
        print("Warning: YAHOO_API_KEY not found")
        return []

    url = f"https://{api_host}/stock/get-news"
    querystring = {"region": "US", "symbol": "NVDA"}
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": api_host
    }

    try:
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        response.raise_for_status()
        data = response.json()
        items = data.get("items", [])
        
        news = []
        for item in items[:limit]:
            news.append({
                "title": item.get("title", "No title"),
                "link": item.get("link", ""),
                "summary": item.get("summary", ""),
                "provider": item.get("publisher", "Yahoo Finance")
            })
        return news
    except Exception as e:
        print(f"Error fetching Yahoo News: {e}")
        return []

async def get_google_news(limit: int = 3) -> List[Dict]:
    try:
        url = "https://news.google.com/rss/search?q=NVIDIA+semiconductor&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(url)
        
        news = []
        for entry in feed.entries[:limit]:
            news.append({
                "title": entry.get("title", "No title"),
                "link": entry.get("link", ""),
                "summary": entry.get("summary", ""),
                "provider": entry.get("source", {}).get("title", "Google News")
            })
        return news
    except Exception as e:
        print(f"Error fetching Google News: {e}")
        return []

async def fetch_all_news() -> List[Dict]:
    # In a real async app we might want to run these concurrently
    yahoo_news = await get_yahoo_news()
    google_news = await get_google_news()
    return yahoo_news + google_news
