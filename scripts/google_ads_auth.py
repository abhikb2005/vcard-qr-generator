from __future__ import annotations

import os
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

ROOT = Path(__file__).resolve().parents[1]
TOKEN_FILE = ROOT / ".seo-engine" / "google_ads_token.json"
SCOPES = ["https://www.googleapis.com/auth/adwords"]


def main() -> None:
    client_id = os.environ.get("GOOGLE_ADS_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_ADS_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise SystemExit(
            "Set GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET before running this script."
        )

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }

    print("Opening browser for Google Ads authorization...")
    print("Please sign in with the Google account that can access the Ads manager/customer account.")
    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")

    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
    print(f"Success. Token saved to {TOKEN_FILE}")


if __name__ == "__main__":
    main()
