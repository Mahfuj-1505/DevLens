#!/usr/bin/env python3
"""
Test script for email verification system
"""

import requests
import json
from app.utils.database import engine
from sqlalchemy import text

def test_email_verification():
    """Test the complete email verification flow"""
    base_url = "http://localhost:8000"

    # Step 1: Send OTP
    print("1. Sending OTP...")
    otp_response = requests.post(f"{base_url}/auth/send-otp",
                                json={"email": "bsse1505@iit.du.ac.bd", "purpose": "registration"})
    print(f"OTP Send Response: {otp_response.status_code}")
    if otp_response.status_code != 200:
        print(f"Error: {otp_response.text}")
        return

    # Step 2: Get OTP from database (for testing)
    print("\n2. Retrieving OTP from database...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT otp_code FROM users WHERE email = 'bsse1505@iit.du.ac.bd'"))
        row = result.fetchone()
        if row:
            otp = row[0]
            print(f"OTP from database: {otp}")
        else:
            print("No OTP found in database")
            return

    # Step 3: Verify OTP
    print("\n3. Verifying OTP...")
    verify_response = requests.post(f"{base_url}/auth/verify-otp",
                                   json={"email": "bsse1505@iit.du.ac.bd", "otp": otp, "purpose": "registration"})
    print(f"OTP Verify Response: {verify_response.status_code}")
    if verify_response.status_code == 200:
        print("✅ Email verification successful!")
    else:
        print(f"❌ Verification failed: {verify_response.text}")

if __name__ == "__main__":
    test_email_verification()