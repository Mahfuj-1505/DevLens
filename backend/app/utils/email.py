"""
Email utility for sending OTPs and notifications
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
from datetime import datetime, timedelta
from app.config.settings import get_settings

settings = get_settings()

def generate_otp(length=6):
    """Generate a random OTP of given length"""
    return ''.join(random.choices(string.digits, k=length))

def send_email(to_email: str, subject: str, body: str):
    """Send email using SMTP"""
    try:
        # Gmail SMTP configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = settings.SMTP_EMAIL
        sender_password = settings.SMTP_PASSWORD

        # For testing: print the email content
        print(f"=== EMAIL TO: {to_email} ===")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print("=== END EMAIL ===")

        # Uncomment the lines below to actually send emails
        # Make sure to set up Gmail App Password first
        """
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, to_email, text)
        server.quit()
        """

        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False

def send_otp_email(email: str, otp: str, purpose: str = "registration"):
    """Send OTP email for registration or password reset"""
    subject = f"DevLens {purpose.title()} OTP"
    body = f"""
    <html>
    <body>
        <h2>DevLens {purpose.title()} Verification</h2>
        <p>Your OTP for {purpose} is: <strong>{otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
    </body>
    </html>
    """
    return send_email(email, subject, body)