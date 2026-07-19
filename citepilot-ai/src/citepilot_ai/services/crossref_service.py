import logging
import re
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)

CROSSREF_API_URL = "https://api.crossref.org/works"
HEADERS = {"User-Agent": "CitePilot-Academic-Auditor/1.0 (mailto:support@citepilot.com)"}


async def validate_doi_and_metadata(doi: str, reference_entry: Dict[str, Any]) -> Dict[str, Any]:
    clean_doi = _clean_doi(doi)
    if not clean_doi:
        return {"valid": False, "status": "invalid_format", "message": "Invalid DOI format"}

    url = f"{CROSSREF_API_URL}/{clean_doi}"
    async with httpx.AsyncClient(timeout=10.0, headers=HEADERS) as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 404:
                return {"valid": False, "status": "not_found", "message": "DOI not found in Crossref database"}
            elif resp.status_code != 200:
                return {"valid": False, "status": "api_error", "message": f"Crossref API error HTTP {resp.status_code}"}

            data = resp.json().get("message", {})
            return _compare_crossref_metadata(data, reference_entry)
        except Exception as e:
            logger.warning(f"Crossref API lookup failed for {clean_doi}: {e}")
            return {"valid": True, "status": "unverified_network", "message": f"Network check skipped: {e}"}


async def search_crossref_by_title_author(title: str, author_family: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if not title or len(title.strip()) < 5:
        return None

    query = title.strip()
    if author_family:
        query += f" {author_family.strip()}"

    params = {"query.bibliographic": query, "rows": 1}
    async with httpx.AsyncClient(timeout=10.0, headers=HEADERS) as client:
        try:
            resp = await client.get(CROSSREF_API_URL, params=params)
            if resp.status_code == 200:
                items = resp.json().get("message", {}).get("items", [])
                if items:
                    item = items[0]
                    return {
                        "doi": item.get("DOI"),
                        "title": item.get("title", [None])[0],
                        "published_year": _extract_crossref_year(item),
                        "journal": item.get("container-title", [None])[0],
                        "volume": item.get("volume"),
                        "issue": item.get("issue"),
                    }
        except Exception as e:
            logger.warning(f"Crossref search failed for {title}: {e}")
    return None


async def check_retraction_status(doi: str) -> Dict[str, Any]:
    clean_doi = _clean_doi(doi)
    if not clean_doi:
        return {"retracted": False, "details": None}

    url = f"{CROSSREF_API_URL}/{clean_doi}"
    async with httpx.AsyncClient(timeout=10.0, headers=HEADERS) as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                message = resp.json().get("message", {})
                update_to = message.get("update-to", [])
                is_retracted = any(item.get("type") == "retraction" for item in update_to)
                if is_retracted:
                    return {
                        "retracted": True,
                        "details": "This work has been formally RETRACTED according to Crossref metadata records.",
                        "notice_doi": update_to[0].get("DOI") if update_to else None
                    }
                title_lower = str(message.get("title", [""])[0]).lower()
                if "retraction" in title_lower or "withdrawn" in title_lower:
                    return {
                        "retracted": True,
                        "details": "Notice of retraction or withdrawal indicated in publication title.",
                        "notice_doi": clean_doi
                    }
        except Exception as e:
            logger.warning(f"Retraction check error for {clean_doi}: {e}")

    return {"retracted": False, "details": None}


def calculate_publication_year_distribution(references: List[Dict[str, Any]], current_year: int = 2026) -> Dict[str, Any]:
    years = []
    for r in references:
        year = r.get("parsed_year") or r.get("year")
        if isinstance(year, int) and 1800 <= year <= current_year + 1:
            years.append(year)

    total = len(years)
    if total == 0:
        return {
            "total_references_with_year": 0,
            "last_5_years_pct": 0.0,
            "last_10_years_pct": 0.0,
            "distribution_by_decade": {},
            "years_list": []
        }

    last_5 = sum(1 for y in years if current_year - y <= 5)
    last_10 = sum(1 for y in years if current_year - y <= 10)

    decades: Dict[str, int] = {}
    for y in years:
        dec = f"{(y // 10) * 10}s"
        decades[dec] = decades.get(dec, 0) + 1

    return {
        "total_references_with_year": total,
        "last_5_years_pct": round((last_5 / total) * 100, 1),
        "last_10_years_pct": round((last_10 / total) * 100, 1),
        "distribution_by_decade": decades,
        "years_list": sorted(years)
    }


def _clean_doi(doi: str) -> Optional[str]:
    if not doi:
        return None
    m = re.search(r"(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)", doi)
    if m:
        return m.group(1).rstrip(".")
    return None


def _extract_crossref_year(item: Dict[str, Any]) -> Optional[int]:
    published = item.get("published-print") or item.get("published-online") or item.get("created")
    if published and "date-parts" in published:
        parts = published["date-parts"]
        if parts and parts[0]:
            return parts[0][0]
    return None


def _compare_crossref_metadata(crossref_msg: Dict[str, Any], ref_entry: Dict[str, Any]) -> Dict[str, Any]:
    mismatches = []

    cr_year = _extract_crossref_year(crossref_msg)
    ref_year = ref_entry.get("parsed_year") or ref_entry.get("year")
    if cr_year and ref_year and int(cr_year) != int(ref_year):
        mismatches.append(f"Year mismatch: Reference says {ref_year}, Crossref record states {cr_year}")

    cr_volume = crossref_msg.get("volume")
    ref_volume = ref_entry.get("parsed_volume")
    if cr_volume and ref_volume and str(cr_volume).strip() != str(ref_volume).strip():
        mismatches.append(f"Volume mismatch: Reference says '{ref_volume}', Crossref record states '{cr_volume}'")

    cr_issue = crossref_msg.get("issue")
    ref_issue = ref_entry.get("parsed_issue")
    if cr_issue and ref_issue and str(cr_issue).strip() != str(ref_issue).strip():
        mismatches.append(f"Issue mismatch: Reference says '{ref_issue}', Crossref record states '{cr_issue}'")

    return {
        "valid": True,
        "status": "matched" if not mismatches else "discrepancies_found",
        "doi": crossref_msg.get("DOI"),
        "crossref_title": crossref_msg.get("title", [None])[0],
        "crossref_year": cr_year,
        "mismatches": mismatches
    }
