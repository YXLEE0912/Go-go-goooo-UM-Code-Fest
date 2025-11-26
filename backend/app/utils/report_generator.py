# backend/utils/report_generator.py
from reportlab.platypus import Image
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import yfinance as yf
import matplotlib.pyplot as plt
from io import BytesIO
from datetime import datetime, timedelta
import logging

from ..models.report import ReportRequest

logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[%(levelname)s] %(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

DEFAULT_TICKER = "NVDA"

WINDOW_MAP = {
    "daily": {"days": 30, "interval": "1d"},
    "weekly": {"days": 180, "interval": "1d"},
    "monthly": {"days": 365, "interval": "1d"},
}


def _compute_window(period_label: str):
    """Return (start_date, end_date, interval) ensuring end date is not today/weekend."""
    period_label = (period_label or "daily").lower()
    window = WINDOW_MAP.get(period_label, WINDOW_MAP["weekly"])

    today = datetime.utcnow().date()
    end_date = today - timedelta(days=1)
    # avoid weekends to ensure market data exists
    while end_date.weekday() >= 5:
        end_date -= timedelta(days=1)

    start_date = end_date - timedelta(days=window["days"])
    return start_date, end_date + timedelta(days=1), window["interval"]


def fetch_stock_history(period_label: str, ticker: str = DEFAULT_TICKER):
    """Fetch historical stock data (avoiding today's date) and compute price deltas."""
    start_date, end_date, interval = _compute_window(period_label)
    logger.info("Fetching %s history for %s..%s (interval=%s)", ticker, start_date, end_date, interval)

    data = yf.download(
        ticker,
        start=start_date,
        end=end_date,
        interval=interval,
        progress=False,
        threads=False,
    )

    if data.empty:
        logger.warning("Primary download returned no rows; retrying with fallback period request.")
        fallback_period = "1mo" if period_label == "daily" else ("6mo" if period_label == "weekly" else "1y")
        data = yf.download(
            ticker,
            period=fallback_period,
            interval=interval,
            progress=False,
            threads=False,
        )

    if data.empty or "Close" not in data.columns:
        raise ValueError(
            f"No closing price data available for {ticker} within {start_date} - {end_date - timedelta(days=1)}"
        )

    history = data[["Close"]].copy()
    history["ChangeAbs"] = history["Close"].diff()
    history["ChangePct"] = history["Close"].pct_change() * 100
    history["Date"] = history.index
    history = history.dropna()

    if len(history) < 2:
        raise ValueError(f"Insufficient market history returned for {ticker}")

    logger.info("Fetched %s rows of %s data.", len(history), ticker)

    return history


def generate_stock_chart(history, ticker: str = DEFAULT_TICKER):
    """Generate a PNG chart from historical data."""
    start_label = history["Date"].min().strftime("%Y-%m-%d")
    end_label = history["Date"].max().strftime("%Y-%m-%d")
    plt.figure(figsize=(8, 4))
    plt.plot(history["Date"], history["Close"], label=f"{ticker} Close Price", color="#2563eb", linewidth=2)
    plt.title(f"{ticker} Performance ({start_label} → {end_label})")
    plt.xlabel("Date")
    plt.ylabel("Price (USD)")
    plt.grid(True, alpha=0.3)
    plt.legend()

    buffer = BytesIO()
    plt.tight_layout()
    plt.savefig(buffer, format="png", bbox_inches="tight", dpi=110)
    plt.close()
    buffer.seek(0)
    return buffer.getvalue()


def build_stock_rows(history, limit: int = 10):
    """Prepare tabular data for PDF."""
    rows = [["Date", "Closing Price", "Daily Change", "Momentum"]]
    recent = history.tail(limit)

    for _, row in recent[::-1].iterrows():  # show newest first
        close_price = float(row["Close"])
        change_pct = float(row.get("ChangePct") or 0.0)
        change_abs = float(row.get("ChangeAbs") or 0.0)
        direction = "↑ Strong" if change_pct > 1 else ("↓ Weak" if change_pct < -1 else "→ Neutral")

        rows.append([
            row["Date"].strftime("%Y-%m-%d"),
            f"${close_price:,.2f}",
            f"{change_abs:+.2f} ({change_pct:+.2f}%)",
            direction,
        ])

    return rows


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
    story.append(Paragraph("GoSense Powered Financial Report", title_style))
    story.append(Spacer(1, 0.3*inch))
    
    info_style = styles['Normal']
    story.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", info_style))
    story.append(Paragraph(f"<b>Ticker:</b> {DEFAULT_TICKER}", info_style))
    story.append(Paragraph(f"<b>Period:</b> {data.period.upper()}", info_style))
    story.append(Spacer(1, 0.3*inch))

    # Market overview & chart
    try:
        history = fetch_stock_history(data.period)
        latest_close = float(history["Close"].iloc[-1])
        previous_close = float(history["Close"].iloc[-2])
        delta = latest_close - previous_close
        delta_pct = (delta / previous_close) * 100 if previous_close else 0

        story.append(Paragraph("<b>Market Overview</b>", styles['Heading2']))
        story.append(Paragraph(f"Current {DEFAULT_TICKER} price: ${latest_close:,.2f}", info_style))
        story.append(Paragraph(f"Day change: {delta:+.2f} ({delta_pct:+.2f}%)", info_style))
        story.append(Spacer(1, 0.2*inch))

        chart_bytes = generate_stock_chart(history, DEFAULT_TICKER)
        chart_img = Image(BytesIO(chart_bytes), width=440, height=220)
        story.append(chart_img)
        story.append(Spacer(1, 0.4*inch))

        # Stock table
        stock_rows = build_stock_rows(history)
        stock_table = Table(stock_rows, colWidths=[1.5*inch, 1.7*inch, 1.7*inch, 1.2*inch])
        stock_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ]))
        story.append(Paragraph("<b>Recent Price Action</b>", styles['Heading2']))
        story.append(stock_table)
        story.append(Spacer(1, 0.4*inch))
    except Exception as e:
        logger.error("Market data unavailable: %s", e)
        story.append(Paragraph("<i>Market data unavailable. Please try again later.</i>", info_style))
        story.append(Spacer(1, 0.3*inch))
    
    # Predictions Section (if included)
    if data.includePredictions and data.predictionData:
        story.append(PageBreak())
        story.append(Paragraph("<b>AI Predictions:</b>", styles['Heading2']))
        
        pred_data = [['Date', 'Predicted Price', 'Confidence', 'Alert']]
        for pred in data.predictionData[:7]:  # Show up to 7 days
            # Handle dict access safely (predictionData is List[Any], likely dicts)
            change = pred.get('change_percent', 0) if isinstance(pred, dict) else getattr(pred, 'change_percent', 0)
            date_value = pred.get('date', 'N/A') if isinstance(pred, dict) else getattr(pred, 'date', 'N/A')
            price_or_prediction = (
                pred.get('price')
                if isinstance(pred, dict)
                else getattr(pred, 'price', None)
            )
            if price_or_prediction is None:
                price_or_prediction = (
                    pred.get('prediction')
                    if isinstance(pred, dict)
                    else getattr(pred, 'prediction', 0)
                )
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
                f"${float(price_or_prediction):.2f}",
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

def generate_report(data):
    """Main report generation function (PDF only)."""
    payload = data if isinstance(data, ReportRequest) else ReportRequest(**data)

    if payload.format != 'pdf':
        raise ValueError("Only PDF reports are supported.")

    content = generate_pdf_report(payload)
    filename = f"financial-report-{payload.period}-{datetime.now().strftime('%Y%m%d')}.pdf"

    return content, filename, "application/pdf"