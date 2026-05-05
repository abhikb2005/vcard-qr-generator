from __future__ import annotations

import json
import os
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

ROOT = Path(__file__).resolve().parents[1]
TOKEN_FILE = ROOT / ".seo-engine" / "adsense_token.json"
SCOPES = ["https://www.googleapis.com/auth/adsense.readonly"]


def load_client_config() -> dict:
    client_id = os.environ.get("ADSENSE_CLIENT_ID")
    client_secret = os.environ.get("ADSENSE_CLIENT_SECRET")
    if client_id and client_secret:
        return {
            "installed": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": ["http://localhost"],
            }
        }

    secrets_file = os.environ.get("ADSENSE_OAUTH_CLIENT_SECRETS_FILE")
    if not secrets_file:
        raise SystemExit(
            "Set ADSENSE_CLIENT_ID/ADSENSE_CLIENT_SECRET or ADSENSE_OAUTH_CLIENT_SECRETS_FILE."
        )
    return json.loads(Path(secrets_file).read_text(encoding="utf-8"))


def main() -> None:
    print("Opening browser for AdSense authorization...")
    print("Please sign in with the Google account that can access the AdSense account.")
    flow = InstalledAppFlow.from_client_config(load_client_config(), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")

    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
    print(f"Success. Token saved to {TOKEN_FILE}")


if __name__ == "__main__":
    main()
