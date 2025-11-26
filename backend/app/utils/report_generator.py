# backend/utils/report_generator.py
import json
from datetime import datetime
from io import BytesIO

def generate_pdf_report(data):
    """Generate PDF report (mock implementation)"""
    content = f"""
    FINANCIAL REPORT
    ================
    
    Report Period: {data.get('period', 'N/A')}
    Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    
    Configuration:
    - Include Charts: {'Yes' if data.get('includeCharts') else 'No'}
    - Include Predictions: {'Yes' if data.get('includePredictions') else 'No'}
    - Include Chat History: {'Yes' if data.get('includeChats') else 'No'}
    
    Data Summary:
    - Chart Data Points: {len(data.get('chartData', []))}
    - Prediction Entries: {len(data.get('predictionData', []))}
    - Chat Messages: {len(data.get('chatHistory', []))}
    - Stock Changes: {len(data.get('stockChanges', []))}
    
    This is a mock PDF report. In production, you would use:
    - ReportLab
    - WeasyPrint
    - or other PDF generation libraries
    """
    
    return content.encode('utf-8')

def generate_excel_report(data):
    """Generate Excel report (mock implementation)"""
    headers = "Date,Value,Change,Direction\n"
    rows = []
    
    for change in data.get('stockChanges', []):
        direction = "UP" if change.get('change', 0) > 0 else "DOWN"
        rows.append(f"{change.get('date', 'N/A')},{change.get('change', 0)},{direction}")
    
    content = headers + "\n".join(rows)
    return content.encode('utf-8')

def generate_word_report(data):
    """Generate Word report (mock implementation)"""
    content = f"""
    Financial Analysis Report
    
    Period: {data.get('period', 'N/A')}
    Format: {data.get('format', 'N/A')}
    
    Report Overview:
    This comprehensive financial report analyzes market trends and provides
    AI-powered predictions for future performance.
    
    Included Sections:
    {', '.join([section for section, included in {
        'Historical Charts': data.get('includeCharts'),
        'AI Predictions': data.get('includePredictions'),
        'Chat Analysis': data.get('includeChats')
    }.items() if included])}
    
    Generated on: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}
    """
    
    return content.encode('utf-8')

def generate_ppt_report(data):
    """Generate PowerPoint report (mock implementation)"""
    content = f"""
    FINANCIAL REPORT PRESENTATION
    
    SLIDE 1: EXECUTIVE SUMMARY
    - Report Period: {data.get('period', 'N/A')}
    - Generated: {datetime.now().strftime('%Y-%m-%d')}
    - Data Sources: {sum([data.get('includeCharts', False), data.get('includePredictions', False), data.get('includeChats', False)])}
    
    SLIDE 2: DATA OVERVIEW
    - Chart Data Points: {len(data.get('chartData', []))}
    - AI Predictions: {len(data.get('predictionData', []))}
    - Chat Interactions: {len(data.get('chatHistory', []))}
    
    SLIDE 3: KEY FINDINGS
    - Market analysis complete
    - Recommendations available
    - Next steps outlined
    """
    
    return content.encode('utf-8')

def generate_report(data):
    """Main report generation function"""
    format_type = data.get('format', 'pdf')
    period = data.get('period', 'daily')
    
    # Generate content based on format
    if format_type == 'pdf':
        content = generate_pdf_report(data)
        content_type = 'application/pdf'
        extension = 'pdf'
    elif format_type == 'excel':
        content = generate_excel_report(data)
        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'xlsx'
    elif format_type == 'word':
        content = generate_word_report(data)
        content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        extension = 'docx'
    elif format_type == 'ppt':
        content = generate_ppt_report(data)
        content_type = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        extension = 'pptx'
    else:
        raise ValueError(f"Unsupported format: {format_type}")
    
    filename = f"financial-report-{period}-{datetime.now().strftime('%Y%m%d')}.{extension}"
    
    return content, filename, content_type