# backend/app/models/report.py
from pydantic import BaseModel
from typing import List, Optional, Any

class ReportRequest(BaseModel):
    format: str
    period: str
    includeCharts: bool
    includeChats: bool
    includePredictions: bool
    chartData: Optional[List[Any]] = None
    predictionData: Optional[List[Any]] = None
    chatHistory: Optional[List[Any]] = None
    stockChanges: Optional[List[Any]] = None
    generatedAt: str

class TestDataResponse(BaseModel):
    chartData: List[Any]
    predictionData: List[Any]
    chatHistory: List[Any]
    stockChanges: List[Any]

