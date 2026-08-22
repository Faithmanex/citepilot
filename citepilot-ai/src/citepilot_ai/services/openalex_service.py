import logging
import urllib.parse
from typing import Any, Dict, Optional

from .http_client import get_http_client

logger = logging.getLogger(__name__)

OPENALEX_API_BASE = "https://api.openalex.org"


async def lookup_openalex_by_doi(doi: str) -> Optional[Dict[str, Any]]:
    """Looks up a work on OpenAlex by DOI."""
    if not doi:
        return None

    clean_doi = doi.strip()
    if clean_doi.startswith("http"):
        clean_doi = clean_doi.split("doi.org/")[-1]

    client = get_http_client()
    url = f"{OPENALEX_API_BASE}/works/https://doi.org/{urllib.parse.quote(clean_doi)}"

    try:
        resp = await client.get(url)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.debug(f"OpenAlex DOI lookup failed for {doi}: {e}")
    return None


async def lookup_openalex_by_title_author(title: Optional[str], author: Optional[str] = None, year: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """Searches OpenAlex by title and optional author family name and publication year."""
    if not title or len(title.strip()) < 5:
        return None

    query = title.strip()
    if author:
        query = f"{query} {author.strip()}"

    client = get_http_client()
    url = f"{OPENALEX_API_BASE}/works"
    params: Dict[str, Any] = {
        "search": query,
        "per_page": 3,
    }
    if year:
        params["filter"] = f"publication_year:{year}"

    try:
        resp = await client.get(url, params=params)
        if resp.status_code == 200:
            data = resp.json()
            results = data.get("results", [])
            if results:
                return results[0]
    except Exception as e:
        logger.debug(f"OpenAlex search failed for '{title}': {e}")
    return None


async def validate_reference_with_openalex(reference: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates reference against OpenAlex as a fallback if Crossref does not have record.
    Returns normalized verification info matching CitePilot's format.
    """
    doi = reference.get("parsed_doi")
    title = reference.get("parsed_title")
    authors = reference.get("parsed_authors", [])
    author_family = None
    if authors and isinstance(authors, list):
        first_author = authors[0]
        if isinstance(first_author, dict):
            author_family = first_author.get("family")
        elif isinstance(first_author, str):
            author_family = first_author.split()[-1]

    year = reference.get("parsed_year")

    work = None
    if doi:
        work = await lookup_openalex_by_doi(doi)
    if not work and title:
        work = await lookup_openalex_by_title_author(title, author_family, year)

    if not work:
        return {
            "verified": False,
            "provider": "openalex",
            "discrepancies": [],
        }

    canonical_title = work.get("title") or ""
    canonical_doi = (work.get("doi") or "").replace("https://doi.org/", "")
    canonical_year = work.get("publication_year")
    canonical_venue = (work.get("primary_location") or {}).get("source", {}).get("display_name")
    is_retracted = work.get("is_retracted", False)

    discrepancies = []
    if year and canonical_year and abs(int(year) - int(canonical_year)) > 1:
        discrepancies.append({
            "field": "year",
            "message": f"Publication year mismatch: document states {year}, OpenAlex records {canonical_year}.",
            "how_to_fix": f"Change citation year to {canonical_year}.",
        })

    return {
        "verified": True,
        "provider": "openalex",
        "canonical_title": canonical_title,
        "canonical_doi": canonical_doi,
        "canonical_year": canonical_year,
        "canonical_venue": canonical_venue,
        "is_retracted": is_retracted,
        "openalex_id": work.get("id"),
        "discrepancies": discrepancies,
    }
