"""Helpers for IIT DU email validation and role parsing."""

import re

IIT_DOMAIN = "@iit.du.ac.bd"
STUDENT_PATTERN = re.compile(r"^bsse(\d{4})@iit\.du\.ac\.bd$")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def is_iit_email(email: str) -> bool:
    return normalize_email(email).endswith(IIT_DOMAIN)


def detect_role(email: str) -> str:
    normalized = normalize_email(email)
    if STUDENT_PATTERN.match(normalized):
        return "student"
    return "teacher"


def extract_batch_and_roll(email: str) -> tuple[int | None, str | None]:
    normalized = normalize_email(email)
    match = STUDENT_PATTERN.match(normalized)
    if not match:
        return None, None
    digits = match.group(1)
    return int(digits[:2]), digits[2:]
