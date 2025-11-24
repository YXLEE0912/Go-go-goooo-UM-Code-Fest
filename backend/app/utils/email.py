import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from typing import Optional

async def send_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
    """
    Send an email using SMTP
    """
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = os.getenv("FROM_EMAIL")
        message["To"] = to_email

        # Add text content
        if text_content:
            text_part = MIMEText(text_content, "plain")
            message.attach(text_part)

        # Add HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)

        # Send email
        await aiosmtplib.send(
            message,
            hostname=os.getenv("SMTP_SERVER"),
            port=int(os.getenv("SMTP_PORT", 587)),
            username=os.getenv("SMTP_USERNAME"),
            password=os.getenv("SMTP_PASSWORD"),
            start_tls=True,  # Use STARTTLS for Gmail port 587
        )

        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

async def send_notification_email(user_email: str, notification_type: str, title: str, message: str):
    """
    Send a notification email to user
    """
    html_content = f"""
    <html>
        <body>
            <h2>{title}</h2>
            <p>{message}</p>
            <br>
            <p>Best regards,<br>GoSense Team</p>
        </body>
    </html>
    """

    text_content = f"{title}\n\n{message}\n\nBest regards,\nGoSense Team"

    return await send_email(user_email, f"GoSense {notification_type}", html_content, text_content)

async def send_price_alert_email(user_email: str, currency: str, current_price: float, threshold: float):
    """
    Send price alert email
    """
    title = f"Price Alert for {currency}"
    message = f"The price of {currency} has reached ${current_price:.4f}, which is below your threshold of ${threshold:.4f}."

    return await send_notification_email(user_email, "Price Alert", title, message)

async def send_risk_alert_email(user_email: str, currency: str, risk_level: str):
    """
    Send risk alert email
    """
    title = f"Risk Alert for {currency}"
    message = f"The risk level for {currency} has changed to: {risk_level}. Please review your positions."

    return await send_notification_email(user_email, "Risk Alert", title, message)

async def send_news_alert_email(user_email: str, news_title: str, news_summary: str):
    """
    Send news alert email
    """
    title = f"News Alert: {news_title}"
    message = f"Latest news: {news_summary}"

    return await send_notification_email(user_email, "News Alert", title, message)