import logging
import re
import urllib.parse
from typing import Dict, Optional

from .http_client import get_http_client

logger = logging.getLogger(__name__)

CROSSREF_API_BASE = "https://api.crossref.org/works"




async def validate_reference_with_crossref(ref_entry: Dict) -> Dict:
    """
    Queries Crossref REST API for a reference entry across ALL citation styles
    and returns metadata verification status, flagged field discrepancies, and actionable 'How to Fix' steps.
    """
    doi = ref_entry.get("parsed_doi")
    title = ref_entry.get("parsed_title")
    authors = ref_entry.get("parsed_authors", [])
    year = ref_entry.get("parsed_year")

    work = None
    if doi:
        clean_doi = _clean_doi(doi)
        work = await _fetch_by_doi(clean_doi)

    if not work and title:
        author_str = authors[0].get("family", "") if authors and isinstance(authors[0], dict) else ""
        work = await _search_by_query(title, author_str)

    if not work:
        return {
            "crossref_verified": False,
            "status": "not_found",
            "message": "Reference metadata could not be found in the Crossref database.",
            "how_to_fix": "Verify that the author names, publication year, and article title are spelled correctly in your reference list, or search doi.org to locate the official DOI.",
            "discrepancies": []
        }

    cr_title = work.get("title", [""])[0] if work.get("title") else ""
    cr_doi = work.get("DOI", "")
    cr_journal = work.get("container-title", [""])[0] if work.get("container-title") else ""
    cr_volume = work.get("volume", "")
    cr_issue = work.get("issue", "")
    cr_page = work.get("page", "")

    cr_year = None
    date_parts = work.get("published-print", {}).get("date-parts") or work.get("published-online", {}).get("date-parts")
    if date_parts and date_parts[0]:
        cr_year = date_parts[0][0]

    discrepancies = []

    if year and cr_year:
        try:
            if int(year) != int(cr_year):
                discrepancies.append({
                    "field": "year",
                    "message": f"Publication year mismatch: Reference lists '{year}', but Crossref records '{cr_year}'.",
                    "how_to_fix": f"Change the year in your reference entry and in-text citation from '{year}' to '{cr_year}'.",
                    "severity": "warning"
                })
        except (ValueError, TypeError):
            pass

    if title and cr_title and not _fuzzy_title_match(title, cr_title):
        discrepancies.append({
            "field": "title",
            "message": f"Title discrepancy detected: Crossref records '{cr_title}'.",
            "how_to_fix": f"Update the article title in your reference entry to match the official publisher title: '{cr_title}'.",
            "severity": "warning"
        })

    if doi and cr_doi and _clean_doi(doi).lower() != cr_doi.lower():
        discrepancies.append({
            "field": "doi",
            "message": f"DOI mismatch: Reference has '{doi}', but Crossref records '{cr_doi}'.",
            "how_to_fix": f"Replace the DOI string in your reference list entry with the verified Crossref DOI: 'https://doi.org/{cr_doi}'.",
            "severity": "error"
        })

    return {
        "crossref_verified": True,
        "status": "verified" if not discrepancies else "discrepancies_found",
        "crossref_doi": cr_doi,
        "crossref_title": cr_title,
        "crossref_journal": cr_journal,
        "crossref_year": cr_year,
        "discrepancies": discrepancies,
        "raw_work": work
    }


async def _fetch_by_doi(doi: str) -> Optional[Dict]:
    url = f"{CROSSREF_API_BASE}/{urllib.parse.quote(doi)}"
    client = get_http_client()
    try:
        resp = await client.get(url)
        if resp.status_code == 200:
            return resp.json().get("message")
    except Exception as e:
        logger.warning(f"Crossref DOI fetch error for {doi}: {e}")
    return None


async def _search_by_query(title: str, author: str) -> Optional[Dict]:
    clean_title = re.sub(r"[^\w\s]", "", title).strip()
    query_str = f"{clean_title} {author}".strip()
    url = f"{CROSSREF_API_BASE}?query.bibliographic={urllib.parse.quote(query_str)}&rows=1"
    client = get_http_client()
    try:
        resp = await client.get(url)
        if resp.status_code == 200:
            items = resp.json().get("message", {}).get("items", [])
            if items:
                return items[0]
    except Exception as e:
        logger.warning(f"Crossref search error for '{query_str}': {e}")
    return None


def _clean_doi(doi_str: str) -> str:
    if not doi_str:
        return ""
    cleaned = doi_str.strip()
    cleaned = re.sub(r"^doi:\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", cleaned, flags=re.IGNORECASE)
    match = re.search(r"10\.\d{4,9}/[-._;()/:A-Za-z0-9]+", cleaned, re.IGNORECASE)
    res = match.group(0) if match else cleaned
    res = re.sub(r"[\.,;\)\]]+$", "", res)
    return res


STOP_WORDS = {"the", "a", "an", "in", "of", "on", "and", "for", "to", "with", "by", "at", "from", "is", "are", "was", "were", "or", "as", "that", "this"}


def _fuzzy_title_match(t1: str, t2: str) -> bool:
    words1 = [w for w in re.sub(r"[^\w\s]", "", t1.lower()).split() if w not in STOP_WORDS]
    words2 = [w for w in re.sub(r"[^\w\s]", "", t2.lower()).split() if w not in STOP_WORDS]
    s1 = set(words1)
    s2 = set(words2)
    if not s1 or not s2:
        return False
    intersection = s1.intersection(s2)
    smaller = min(len(s1), len(s2))
    return (len(intersection) / smaller) >= 0.75
