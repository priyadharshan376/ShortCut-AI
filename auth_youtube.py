import os
import sys
import json
from pathlib import Path

# Force UTF-8 on Windows consoles to prevent cp1252 UnicodeEncodeError
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from google_auth_oauthlib.flow import InstalledAppFlow

BASE_DIR = Path(__file__).resolve().parent
CLIENT_SECRETS_FILE = BASE_DIR / "client_secrets.json"
TOKEN_FILE = BASE_DIR / "backend" / "database" / "youtube_token.json"

# Scopes needed to upload Shorts and display your connected channel's name & icon
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly"
]

def authenticate():
    print("=" * 72)
    print("      ShortCut AI -- YouTube Channel One-Time Authorization")
    print("=" * 72)

    if not CLIENT_SECRETS_FILE.exists():
        print(f"\n[ERROR] '{CLIENT_SECRETS_FILE}' not found.")
        print("\nPlease follow SETUP_GUIDE.md or the in-app Setup Guide:")
        print("1. Create a Google Cloud Project & enable YouTube Data API v3")
        print("2. Create OAuth 2.0 Client ID (Desktop App)")
        print("3. Download JSON and save it as 'client_secrets.json' in this folder.")
        return False

    flow = InstalledAppFlow.from_client_secrets_file(
        str(CLIENT_SECRETS_FILE),
        SCOPES
    )

    print("\nStarting local authorization receiver...")

    prompt_msg = (
        "\n" + "=" * 72 + "\n"
        ">> COPY & PASTE THIS LINK INTO YOUR BROWSER (or Incognito window):\n"
        "{url}\n" +
        "=" * 72 + "\n\n"
        "Waiting for you to sign into your YouTube channel's Google account and click 'Allow'...\n"
    )

    try:
        credentials = flow.run_local_server(
            host="localhost",
            port=0,
            open_browser=True,
            authorization_prompt_message=prompt_msg,
            success_message="ShortCut AI connected successfully! You may close this browser tab and return to the app."
        )

        TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(credentials.to_json())

        print("\n" + "=" * 72)
        print("  [SUCCESS] YouTube Channel Connected Successfully!")
        print("=" * 72)
        print(f"Token saved to: {TOKEN_FILE}")
        print("ShortCut AI is now ready to upload Shorts directly to your channel.\n")
        return True

    except Exception as e:
        print(f"\n[ERROR] Authorization encountered an issue: {e}")
        return False

if __name__ == "__main__":
    authenticate()
