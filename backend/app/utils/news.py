import os
import httpx
import feedparser
from typing import List, Dict
import time
from textblob import TextBlob

def analyze_sentiment(text: str) -> Dict:
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    
    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"
        
    # Determine impact based on sentiment magnitude
    # Strong sentiment (positive or negative) implies high impact
    if abs(polarity) > 0.5:
        impact = "high"
    elif abs(polarity) > 0.1:
        impact = "medium"
    else:
        impact = "low"
        
    return {
        "score": polarity,
        "label": sentiment,
        "impact": impact
    }

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
            title = entry.get("title", "No title")
            summary = entry.get("summary", "") or entry.get("description", "")
            
            # Analyze sentiment of title + summary
            sentiment_data = analyze_sentiment(f"{title} {summary}")
            
            news.append({
                "title": title,
                "link": entry.get("link", ""),
                "summary": summary,
                "provider": "Yahoo Finance",
                "sentiment": sentiment_data["label"],
                "sentiment_score": sentiment_data["score"],
                "impact": sentiment_data["impact"]
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
            title = entry.get("title", "No title")
            summary = entry.get("summary", "")
            
            # Analyze sentiment of title + summary
            sentiment_data = analyze_sentiment(f"{title} {summary}")
            
            news.append({
                "title": title,
                "link": entry.get("link", ""),
                "summary": summary,
                "provider": entry.get("source", {}).get("title", "Google News"),
                "sentiment": sentiment_data["label"],
                "sentiment_score": sentiment_data["score"],
                "impact": sentiment_data["impact"]
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
