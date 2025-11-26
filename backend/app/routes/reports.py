# backend/routes/reports.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from datetime import datetime
import json
from ..utils.report_generator import generate_pdf_report
from ..models.report import ReportRequest, TestDataResponse

router = APIRouter()

# PDF generation is now handled by report_generator.py
# Removed generate_pdf_content() - using generate_pdf_report() from utils instead

def generate_excel_content(data: ReportRequest):
    """Generate Excel content (mock implementation)"""
    headers = "Date,Value,Change,Direction\n"
    rows = []
    
    if data.stockChanges:
        for change in data.stockChanges:
            direction = "UP" if change.get('change', 0) > 0 else "DOWN"
            rows.append(f"{change.get('date', 'N/A')},{change.get('value', change.get('change', 0))},{change.get('change', 0)},{direction}")
    
    content = headers + "\n".join(rows) if rows else "No data available"
    return content.encode('utf-8')

def generate_word_content(data: ReportRequest):
    """Generate Word content (mock implementation)"""
    content = f"""
    GoSense Financial Analysis Report
    
    Period: {data.period.upper()}
    Report Format: {data.format.upper()}
    
    Executive Summary:
    This comprehensive financial report provides analysis of market trends
    and AI-powered predictions for informed decision making.
    
    Included Sections:
    {', '.join([section for section, included in {
        'Historical Charts': data.includeCharts,
        'AI Predictions': data.includePredictions,
        'Chat Analysis': data.includeChats
    }.items() if included]) or 'No sections selected'}
    
    Data Overview:
    - Total data points analyzed: {len(data.chartData) if data.chartData else 0}
    - AI predictions generated: {len(data.predictionData) if data.predictionData else 0}
    - Chat interactions: {len(data.chatHistory) if data.chatHistory else 0}
    
    Generated on: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}
    """
    return content.encode('utf-8')

def generate_ppt_content(data: ReportRequest):
    """Generate PowerPoint content (mock implementation)"""
    content = f"""
    GO SENSE FINANCIAL REPORT
    
    SLIDE 1: EXECUTIVE SUMMARY
    - Report Period: {data.period.upper()}
    - Generated: {datetime.now().strftime('%Y-%m-%d')}
    - Data Sources: {sum([data.includeCharts, data.includePredictions, data.includeChats])}
    
    SLIDE 2: DATA OVERVIEW
    - Chart Data Points: {len(data.chartData) if data.chartData else 0}
    - AI Predictions: {len(data.predictionData) if data.predictionData else 0}
    - Chat Interactions: {len(data.chatHistory) if data.chatHistory else 0}
    - Stock Changes: {len(data.stockChanges) if data.stockChanges else 0}
    
    SLIDE 3: KEY INSIGHTS
    - Market analysis complete
    - AI predictions available
    - Chat insights included
    - Ready for presentation
    """
    return content.encode('utf-8')

@router.post("/generate-report")
async def generate_report(request: ReportRequest):
    try:
        print(f"Generating {request.format} report for {request.period} period")
        
        # Generate content based on format
        if request.format == 'pdf':
            # Use the ReportLab implementation from report_generator.py
            content = generate_pdf_report(request)
            media_type = "application/pdf"
            filename = f"gosense-report-{request.period}.pdf"
        elif request.format == 'excel':
            content = generate_excel_content(request)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"gosense-report-{request.period}.xlsx"
        elif request.format == 'word':
            content = generate_word_content(request)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            filename = f"gosense-report-{request.period}.docx"
        elif request.format == 'ppt':
            content = generate_ppt_content(request)
            media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            filename = f"gosense-report-{request.period}.pptx"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")

        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.get("/test-data")
async def get_test_data():
    """Provide sample data for testing"""
    test_data = {
        "chartData": [
            {"date": "2024-01-01", "value": 100},
            {"date": "2024-01-02", "value": 105},
            {"date": "2024-01-03", "value": 98},
            {"date": "2024-01-04", "value": 110},
            {"date": "2024-01-05", "value": 115},
        ],
        "predictionData": [
            {"date": "2024-01-06", "prediction": 118, "confidence": 0.85},
            {"date": "2024-01-07", "prediction": 122, "confidence": 0.78},
            {"date": "2024-01-08", "prediction": 119, "confidence": 0.82},
        ],
        "chatHistory": [
            {"question": "What is the current trend?", "answer": "The market shows upward momentum with strong buying pressure."},
            {"question": "Any predictions for next week?", "answer": "Expected to continue bullish trend with 85% confidence."},
        ],
        "stockChanges": [
            {"date": "2024-01-01", "change": 2.5},
            {"date": "2024-01-02", "change": -1.2},
            {"date": "2024-01-03", "change": 3.8},
            {"date": "2024-01-04", "change": 0.5},
            {"date": "2024-01-05", "change": 2.1},
        ]
    }
    return test_data