# scripts/config.py
import os

API_BASE = "https://djg-debian.coho-jazz.ts.net/be/"
TOKEN = os.getenv("CHINWAG_TOKEN", "")
TIMEOUT = 30  # seconds per request
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds between retries
