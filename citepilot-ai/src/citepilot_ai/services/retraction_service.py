import logging
import re
import urllib.parse
from typing import Dict, Optional

from .crossref_service import _clean_doi, get_http_client

logger = logging.getLogger(__name__)

CROSSREF_API_BASE = "https://api.crossref.org/works"


async def check_retraction_status(doi: Optional[str], title: Optional[str] = None, crossref_work: Optional[Dict] = None) -> Dict:
    """
    Checks if a reference entry (by DOI or title) has been retracted or flagged with an
    Expression of Concern in Crossref / Retraction Watch data, providing clear 'How to Fix' guidance.
    Reuses pre-fetched Crossref work JSON if available to avoid duplicate network calls.
    """
    if not doi and not title and not crossref_work:
        return {"is_retracted": False, "status": "normal", "message": None, "how_to_fix": None}

    work = crossref_work

    if not work and doi:
        clean_doi = _clean_doi(doi)
        work = await _fetch_crossref_work(clean_doi)

    if not work and title:
        work = await _search_crossref_work(title)

    if work:
        return _analyze_crossref_retraction(work)

    return {
        "is_retracted": False,
        "status": "normal",
        "message": None,
        "how_to_fix": None
    }


def _analyze_crossref_retraction(work: Dict) -> Dict:
    if not work or not isinstance(work, dict):
        return {"is_retracted": False, "status": "normal", "message": None, "how_to_fix": None}

    relation = work.get("relation", {})
    update_to = work.get("update-to", [])

    is_retracted_by = relation.get("is-retracted-by", [])
    if is_retracted_by:
        notice_doi = is_retracted_by[0].get("id", "")
        return {
            "is_retracted": True,
            "status": "retracted",
            "severity": "red",
            "notice_doi": notice_doi,
            "message": f"RETRACTED PAPER: This reference was formally retracted. Notice DOI: {notice_doi}",
            "how_to_fix": "Remove this reference from your manuscript or cite a non-retracted peer-reviewed study that supports your thesis."
        }

    for update in update_to:
        label = update.get("label", "").lower()
        type_up = update.get("type", "").lower()
        if "retraction" in label or "retraction" in type_up or "withdrawn" in label:
            return {
                "is_retracted": True,
                "status": "retracted",
                "severity": "red",
                "notice_doi": update.get("DOI", ""),
                "message": f"RETRACTED PAPER: Marked as retracted in Crossref records ({update.get('label', 'Retraction Notice')}).",
                "how_to_fix": "Remove this reference from your manuscript or cite an active non-retracted source."
            }
        elif "concern" in label or "expression of concern" in label:
            return {
                "is_retracted": True,
                "status": "expression_of_concern",
                "severity": "orange",
                "notice_doi": update.get("DOI", ""),
                "message": "EXPRESSION OF CONCERN: Publisher issued an Expression of Concern for this publication.",
                "how_to_fix": "Inspect the publisher's Expression of Concern notice and qualify the claim in your text accordingly."
            }

    titles = work.get("title", [])
    if titles:
        t_lower = titles[0].lower().strip()
        if t_lower.startswith(("retracted:", "retracted article:", "[retracted]", "retraction:")) or " [retracted]" in t_lower:
            return {
                "is_retracted": True,
                "status": "retracted",
                "severity": "red",
                "notice_doi": work.get("DOI", ""),
                "message": "RETRACTED PAPER: Title is prefixed as Retracted Article in publisher metadata.",
                "how_to_fix": "Remove this citation or replace it with a valid, non-retracted reference."
            }

    return {"is_retracted": False, "status": "normal", "message": None, "how_to_fix": None}


async def _fetch_crossref_work(doi: str) -> Optional[Dict]:
    url = f"{CROSSREF_API_BASE}/{urllib.parse.quote(doi)}"
    client = get_http_client()
    try:
        resp = await client.get(url)
        if resp.status_code == 200:
            return resp.json().get("message")
    except Exception as e:
        logger.warning(f"Retraction check error for DOI {doi}: {e}")
    return None


async def _search_crossref_work(title: str) -> Optional[Dict]:
    client = get_http_client()
    params = {"query.title": title, "rows": 1}
    try:
        resp = await client.get(CROSSREF_API_BASE, params=params)
        if resp.status_code == 200:
            items = resp.json().get("message", {}).get("items", [])
            if items:
                return items[0]
    except Exception as e:
        logger.warning(f"Retraction check title search error for '{title}': {e}")
    return None
