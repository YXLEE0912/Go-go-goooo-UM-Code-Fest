# backend/app/models/report.py
from pydantic import BaseModel
from typing import List, Optional, Any, Literal


class ReportRequest(BaseModel):
    format: Literal['pdf'] = 'pdf'
    period: str = 'daily'
    includeCharts: bool = True
    includeChats: bool = True
    includePredictions: bool = True
    chartData: Optional[List[Any]] = None
    predictionData: Optional[List[Any]] = None
    chatHistory: Optional[List[Any]] = None
    stockChanges: Optional[List[Any]] = None
    generatedAt: Optional[str] = None


class TestDataResponse(BaseModel):
    chartData: List[Any]
    predictionData: List[Any]
    chatHistory: List[Any]
    stockChanges: List[Any]

