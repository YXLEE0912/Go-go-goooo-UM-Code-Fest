# backend/utils/report_generator.py
import json
from typing import TYPE_CHECKING
from reportlab.platypus import Image
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import yfinance as yf
import matplotlib.pyplot as plt
import base64
from io import BytesIO
from datetime import datetime
import logging

# Import ReportRequest from models to avoid circular import
from ..models.report import ReportRequest

logger = logging.getLogger(__name__)

def generate_pdf_report(data: ReportRequest):
    """Generate actual PDF report using ReportLab"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    story.append(Paragraph("GoSense Financial Report", title_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Report Info
    info_style = styles['Normal']
    story.append(Paragraph(f"<b>Report Period:</b> {data.period.upper()}", info_style))
    story.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", info_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Configuration Section
    story.append(Paragraph("<b>Report Configuration:</b>", styles['Heading2']))
    config_data = [
        ['Setting', 'Value'],
        ['Include Charts', 'Yes' if data.includeCharts else 'No'],
        ['Include Predictions', 'Yes' if data.includePredictions else 'No'],
        ['Include Chat History', 'Yes' if data.includeChats else 'No'],
    ]
    config_table = Table(config_data, colWidths=[3*inch, 2*inch])
    config_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(config_table)
    story.append(Spacer(1, 0.5*inch))
    
    # Chart Section with error handling
    if data.includeCharts:
        try:
            chart_bytes, _ = generate_stock_chart("NVDA", period="3mo", interval="1d")
            chart_img = Image(BytesIO(chart_bytes), width=400, height=200)
            story.append(chart_img)
            story.append(Spacer(1, 0.5*inch))
        except ValueError as e:
            # Handle case where no data is found for the ticker
            logger.warning(f"Chart generation failed: {str(e)}")
            error_msg = Paragraph(
                f"<i>Chart unavailable: Unable to fetch stock data for NVDA. {str(e)}</i>",
                styles['Normal']
            )
            story.append(error_msg)
            story.append(Spacer(1, 0.5*inch))
        except Exception as e:
            # Handle any other errors (network issues, plotting errors, etc.)
            logger.error(f"Unexpected error during chart generation: {str(e)}")
            error_msg = Paragraph(
                "<i>Chart unavailable: An error occurred while generating the stock chart. Please try again later.</i>",
                styles['Normal']
            )
            story.append(error_msg)
            story.append(Spacer(1, 0.5*inch))

    # Stock Changes Table (if included)
    if data.stockChanges:
        story.append(Paragraph("<b>Stock Price Changes:</b>", styles['Heading2']))
        stock_data = [['Date', 'Price', 'Change', 'Status']]
        
        for change in data.stockChanges[:10]:  # Limit to 10 rows
            # Handle dict access safely (stockChanges is List[Any], likely dicts)
            change_value = change.get('change', 0) if isinstance(change, dict) else getattr(change, 'change', 0)
            date_value = change.get('date', 'N/A') if isinstance(change, dict) else getattr(change, 'date', 'N/A')
            price_value = change.get('value', 0) if isinstance(change, dict) else getattr(change, 'value', 0)
            
            status = "↑ UP" if change_value > 0 else "↓ DOWN"
            stock_data.append([
                str(date_value),
                f"${float(price_value):.2f}",
                f"{float(change_value):+.2f}%",
                status
            ])
        
        stock_table = Table(stock_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        stock_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(stock_table)
        story.append(Spacer(1, 0.5*inch))
    
    # Predictions Section (if included)
    if data.includePredictions and data.predictionData:
        story.append(PageBreak())
        story.append(Paragraph("<b>AI Predictions:</b>", styles['Heading2']))
        
        pred_data = [['Date', 'Predicted Price', 'Confidence', 'Alert']]
        for pred in data.predictionData[:7]:  # Show up to 7 days
            # Handle dict access safely (predictionData is List[Any], likely dicts)
            change = pred.get('change_percent', 0) if isinstance(pred, dict) else getattr(pred, 'change_percent', 0)
            date_value = pred.get('date', 'N/A') if isinstance(pred, dict) else getattr(pred, 'date', 'N/A')
            price_value = pred.get('price', 0) if isinstance(pred, dict) else getattr(pred, 'price', 0)
            confidence_value = pred.get('confidence', 0) if isinstance(pred, dict) else getattr(pred, 'confidence', 0)
            
            # Add alert logic
            alert = ""
            if change < -7:
                alert = "⚠ CRITICAL"
            elif change < -5:
                alert = "⚠ WARNING"
            else:
                alert = "✓ STABLE"
            
            pred_data.append([
                str(date_value),
                f"${float(price_value):.2f}",
                f"{float(confidence_value)*100:.1f}%",
                alert
            ])
        
        pred_table = Table(pred_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        pred_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(pred_table)
    
    # Chat History (if included)
    if data.includeChats and data.chatHistory:
        story.append(PageBreak())
        story.append(Paragraph("<b>Chat Insights:</b>", styles['Heading2']))
        
        for i, chat in enumerate(data.chatHistory[:5], 1):
            # Handle dict access safely (chatHistory is List[Any], likely dicts)
            question = chat.get('question', 'N/A') if isinstance(chat, dict) else getattr(chat, 'question', 'N/A')
            answer = chat.get('answer', 'N/A') if isinstance(chat, dict) else getattr(chat, 'answer', 'N/A')
            story.append(Paragraph(f"<b>Q{i}:</b> {str(question)}", info_style))
            story.append(Paragraph(f"<b>A{i}:</b> {str(answer)}", info_style))
            story.append(Spacer(1, 0.2*inch))
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    story.append(Paragraph(f"Generated by GoSense Analytics | {datetime.now().strftime('%B %d, %Y')}", footer_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

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


def generate_stock_chart(ticker: str, period: str = "1mo", interval: str = "1d"):
    """
    Fetch stock data from Yahoo Finance and generate a chart.
    
    Args:
        ticker (str): Stock symbol, e.g. "NVDA" or "AAPL".
        period (str): Data period, e.g. "1mo", "3mo", "6mo", "1y".
        interval (str): Data interval, e.g. "1d" (daily), "1wk" (weekly), "1mo" (monthly).
    
    Returns:
        chart_bytes (bytes): PNG image bytes of the chart.
        chart_base64 (str): Base64 string for embedding in reports.
    
    Raises:
        ValueError: If no data is found for the given ticker/period/interval.
        Exception: For network errors, plotting errors, or other unexpected issues.
    """
    try:
        # Fetch data with error handling
        logger.info(f"Fetching stock data for {ticker} (period={period}, interval={interval})")
        data = yf.download(ticker, period=period, interval=interval, progress=False, show_errors=False)
        
        if data.empty:
            raise ValueError(f"No data found for {ticker} with period={period}, interval={interval}")
        
        # Check if 'Close' column exists
        if 'Close' not in data.columns:
            raise ValueError(f"Invalid data structure: 'Close' column not found for {ticker}")
        
        # Plot chart with error handling
        try:
            plt.figure(figsize=(8, 4))
            plt.plot(data.index, data['Close'], label=f"{ticker} Close Price", color="blue")
            plt.title(f"{ticker} Stock Prices ({period}, {interval})")
            plt.xlabel("Date")
            plt.ylabel("Price (USD)")
            plt.legend()
            plt.grid(True)
            
            # Save to buffer
            buffer = BytesIO()
            plt.savefig(buffer, format="png", bbox_inches="tight", dpi=100)
            plt.close()
            buffer.seek(0)
            
            # Convert to base64 for embedding
            chart_bytes = buffer.getvalue()
            chart_base64 = base64.b64encode(chart_bytes).decode("utf-8")
            
            logger.info(f"Successfully generated chart for {ticker}")
            return chart_bytes, chart_base64
            
        except Exception as plot_error:
            plt.close()  # Ensure matplotlib figure is closed even on error
            logger.error(f"Error plotting chart for {ticker}: {str(plot_error)}")
            raise Exception(f"Failed to generate chart plot: {str(plot_error)}")
            
    except ValueError:
        # Re-raise ValueError as-is (for empty data, missing columns)
        raise
    except Exception as e:
        # Handle network errors, API errors, etc.
        logger.error(f"Error fetching stock data for {ticker}: {str(e)}")
        raise Exception(f"Failed to fetch stock data for {ticker}: {str(e)}")


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