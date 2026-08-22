import logging
from typing import Optional

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

_http_client: Optional[httpx.AsyncClient] = None


def _get_user_agent() -> str:
    mailto = getattr(settings, "crossref_mailto", "support@citepilot.ai")
    return f"CitePilot-Academic-Auditor/1.0 (mailto:{mailto})"


def get_http_client() -> httpx.AsyncClient:
    """Shared AsyncClient with connection pooling for reuse across external API services."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0),
            headers={
                "User-Agent": _get_user_agent(),
                "Accept": "application/json",
            },
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
            follow_redirects=True,
        )
    return _http_client


async def close_http_client():
    """Closes the shared client pool on application shutdown."""
    global _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None
