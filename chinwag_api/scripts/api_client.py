# scripts/api_client.py
import time
import requests
from scripts.config import API_BASE, TOKEN, TIMEOUT, MAX_RETRIES, RETRY_DELAY

class ChinwagClient:
    def __init__(self, api_base=None, token=None):
        self.api_base = api_base or API_BASE
        self.token = token or TOKEN
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"LLT {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        })

    def _url(self, path):
        return f"{self.api_base.rstrip('/')}/{path.lstrip('/')}"

    def _request(self, method, path, **kwargs):
        url = self._url(path)
        kwargs.setdefault("timeout", TIMEOUT)
        for attempt in range(MAX_RETRIES):
            try:
                resp = self.session.request(method, url, **kwargs)
                if resp.status_code >= 500:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                resp.raise_for_status()
                return resp.json() if resp.content else {}
            except requests.exceptions.RequestException as e:
                if attempt == MAX_RETRIES - 1:
                    raise
                time.sleep(RETRY_DELAY * (attempt + 1))
        return {}

    def get(self, path, **kwargs):
        return self._request("GET", path, **kwargs)

    def post(self, path, **kwargs):
        return self._request("POST", path, **kwargs)

    def patch(self, path, **kwargs):
        return self._request("PATCH", path, **kwargs)

    def delete(self, path, **kwargs):
        return self._request("DELETE", path, **kwargs)
