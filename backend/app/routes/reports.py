# backend/routes/reports.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from ..utils.report_generator import generate_pdf_report
from ..models.report import ReportRequest, TestDataResponse

router = APIRouter()


@router.post("/generate-report")
async def generate_report(request: ReportRequest):
    try:
        payload = request
        if request.format != 'pdf':
            payload = ReportRequest(**{**request.dict(), "format": "pdf"})

        content = generate_pdf_report(payload)
        filename = f"gosense-report-{payload.period}.pdf"

        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
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
            {"question": "What is the current trend?", "answer": "The market shows upward momentum with strong growth indicators."},
            {"question": "Any predictions for next week?", "answer": "Expected to continue positive expansion trend with 85% confidence."},
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