#!/usr/bin/env python3
"""
Database migration script to add OTP fields to users table
"""

from app.utils.database import engine
from sqlalchemy import text

def add_otp_columns():
    """Add OTP columns to users table"""
    try:
        with engine.connect() as conn:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'users'
                AND COLUMN_NAME IN ('otp_code', 'otp_expires_at', 'is_verified')
            """))

            existing_columns = [row[0] for row in result.fetchall()]

            # Add columns if they don't exist
            if 'otp_code' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN otp_code VARCHAR(10) NULL"))
                print("Added otp_code column")

            if 'otp_expires_at' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN otp_expires_at DATETIME NULL"))
                print("Added otp_expires_at column")

            if 'is_verified' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_verified INT DEFAULT 0"))
                print("Added is_verified column")

            conn.commit()
            print("Migration completed successfully!")

    except Exception as e:
        print(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    add_otp_columns()