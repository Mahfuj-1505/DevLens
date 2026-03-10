#!/usr/bin/env python3
import subprocess
import tempfile
import os
import sys

def lint_message(msg: str):
    """
    Run gitlint on the provided message string.
    Returns a tuple (passed: bool, output: str).
    """
    # Write message to a temporary file
    with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
        tmp.write(msg)
        tmp.flush()
        tmp_name = tmp.name

    try:
        # Run gitlint pointing to the temp file
        res = subprocess.run(
            ["gitlint", "--msg-filename", tmp_name],
            capture_output=True,
            text=True
        )
        passed = (res.returncode == 0)
        return passed, res.stdout + res.stderr
    finally:
        # Clean up
        os.remove(tmp_name)

def main():
    # Example messages to test
    messages = [
        "Fix bug in authentication flow",           # likely good
        "WIP",                                     # likely bad (too short, vague)
        "Add new feature: user profile image upload\n\n- allow JPEG/PNG\n- update docs",  # longer commit
    ]

    for i, m in enumerate(messages):
        passed, output = lint_message(m)
        print(f"Message #{i+1}: {'PASS' if passed else 'FAIL'}")
        if not passed:
            print("gitlint output:")
            print(output.strip())
        print("-" * 40)

if __name__ == "__main__":
    main()


"""

Gitlint Overview

Purpose: Lints commit messages to enforce style, formatting, and basic content rules.

Checks Include: Title length, forbidden words (e.g., “WIP”), presence of a body, conventional commit types, no trailing whitespace, etc.

Rule Types:

T → Title-related rules (e.g., T5, T8)

B → Body-related rules (e.g., B6)

C → Commit/footer-related rules

Practical Use

Gitlint can check the quality of commit messages but not the semantic “meaningfulness” of the changes themselves.

You can test commit-message strings in Python by calling Gitlint via subprocess (or using the CLI).

Example output explains violations per line and rule ID:

T5 Title contains forbidden words → title contains disallowed words like “WIP”

T8 Title too short → title shorter than minimum length

B6 Body message is missing → commit body is absent

Configuration & Sources

Gitlint rules are built-in by default but can be customized in a .gitlint config file.

Rule IDs and their meanings are documented in Gitlint’s official docs.

In short: Gitlint enforces commit-message quality using built-in rules (T/B/C types) and can be tested programmatically or via CLI. It does not assess code meaning, only message format.

"""
