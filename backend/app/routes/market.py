from fastapi import APIRouter, HTTPException
import yfinance as yf
from typing import List, Dict, Any
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/market/history", response_model=List[Dict[str, Any]])
async def get_market_history(days: int = 30, period: str = "Week", month_index: int = 0, year: int = 2024, symbol: str = "NVDA"):
    try:
        # Default to current time
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        # Logic to handle the specific "Month" and "Week" selection from frontend
        if period == "Month":
            try:
                start_date = datetime(year, month_index + 1, 1)
                if month_index == 11:
                    end_date = datetime(year + 1, 1, 1)
                else:
                    end_date = datetime(year, month_index + 2, 1)
                
                if end_date > datetime.now():
                    end_date = datetime.now()
                if start_date > datetime.now():
                    return []
            except ValueError:
                pass
        
        elif period == "Week":
            try:
                target_month_start = datetime(year, month_index + 1, 1)
                now = datetime.now()
                if target_month_start.month == now.month and target_month_start.year == now.year:
                    end_date = now
                    start_date = now - timedelta(days=days)
                else:
                    start_date = target_month_start
                    end_date = target_month_start + timedelta(days=days)
            except ValueError:
                pass

        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"), interval="1d")
        
        if df.empty:
             if period == "Week":
                df = ticker.history(period="5d", interval="1d")
             else:
                df = ticker.history(period="1mo", interval="1d")

        # Convert to list of dicts
        result = []
        for index, row in df.iterrows():
            # index is Timestamp
            result.append({
                "date": index.strftime("%Y-%m-%d"),
                "price": row['Close']
            })

        return result

    except Exception as e:
        print(f"Error fetching market data: {e}")
        return []
