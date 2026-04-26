#!/usr/bin/env python3
"""
Script to mark all existing users as verified
This is needed for users who registered before the OTP system was implemented
"""

from app.utils.database import engine
from sqlalchemy import text

def mark_existing_users_verified():
    """Mark all existing users as verified"""
    try:
        with engine.connect() as conn:
            # Update all users to be verified
            result = conn.execute(text("""
                UPDATE users
                SET is_verified = 1
                WHERE is_verified = 0 OR is_verified IS NULL
            """))

            updated_count = result.rowcount
            conn.commit()

            print(f"✅ Successfully marked {updated_count} existing users as verified!")
            print("Existing users can now log in without email verification.")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    mark_existing_users_verified()