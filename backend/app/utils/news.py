import os
import httpx
import feedparser
from typing import List, Dict
import time

async def get_yahoo_news(limit: int = 3) -> List[Dict]:
    try:
        print("Fetching Yahoo News...")
        # Yahoo Finance RSS for NVIDIA
        url = "https://finance.yahoo.com/rss/headline?s=NVDA"
        
        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Yahoo often requires a User-Agent
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status()
            xml_content = response.text

        feed = feedparser.parse(xml_content)
        
        news = []
        for entry in feed.entries[:limit]:
            news.append({
                "title": entry.get("title", "No title"),
                "link": entry.get("link", ""),
                "summary": entry.get("summary", "") or entry.get("description", ""),
                "provider": "Yahoo Finance"
            })
        print(f"Fetched {len(news)} articles from Yahoo.")
        return news
    except Exception as e:
        print(f"Error fetching Yahoo News: {e}")
        return []

async def get_google_news(limit: int = 3) -> List[Dict]:
    try:
        url = "https://news.google.com/rss/search?q=NVIDIA+semiconductor&hl=en-US&gl=US&ceid=US:en"
        
        # Use httpx for async fetching with timeout
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            response.raise_for_status()
            xml_content = response.text

        feed = feedparser.parse(xml_content)
        
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
