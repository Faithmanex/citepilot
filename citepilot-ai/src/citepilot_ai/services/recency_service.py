from datetime import datetime
from typing import Dict, List


def calculate_publication_recency(references: List[Dict]) -> Dict:
    """
    Computes publication recency distribution and statistics across all references.
    Used for academic compliance reporting (e.g. percentage of sources published within last 5-10 years).
    """
    current_year = datetime.now().year
    years = []

    for ref in references:
        yr = ref.get("parsed_year")
        if yr is not None:
            try:
                yr_int = int(str(yr).strip())
                if 1800 <= yr_int <= current_year + 1:
                    years.append(yr_int)
            except (ValueError, TypeError):
                pass

    total_parsed_sources = len(references)

    if not years or total_parsed_sources == 0:
        return {
            "total_parsed_sources": total_parsed_sources,
            "valid_year_sources": len(years),
            "within_3_years_count": 0,
            "within_3_years_percent": 0.0,
            "within_5_years_count": 0,
            "within_5_years_percent": 0.0,
            "within_10_years_count": 0,
            "within_10_years_percent": 0.0,
            "older_than_10_years_count": 0,
            "older_than_10_years_percent": 0.0,
            "average_publication_year": None,
            "average_source_age_years": None,
            "recency_compliance_status": "insufficient_data"
        }

    valid_count = len(years)
    w3 = sum(1 for y in years if current_year - y <= 3)
    w5 = sum(1 for y in years if current_year - y <= 5)
    w10 = sum(1 for y in years if current_year - y <= 10)
    older = sum(1 for y in years if current_year - y > 10)

    avg_yr = round(sum(years) / valid_count, 1)
    avg_age = round(current_year - avg_yr, 1)

    # Calculate percentages against total reference count
    p3 = round((w3 / total_parsed_sources) * 100, 1)
    p5 = round((w5 / total_parsed_sources) * 100, 1)
    p10 = round((w10 / total_parsed_sources) * 100, 1)
    p_older = round((older / total_parsed_sources) * 100, 1)

    if p5 >= 50.0:
        compliance = "highly_recent"
    elif p10 >= 70.0:
        compliance = "compliant"
    else:
        compliance = "dated_sources_warning"

    return {
        "total_parsed_sources": total_parsed_sources,
        "valid_year_sources": valid_count,
        "within_3_years_count": w3,
        "within_3_years_percent": p3,
        "within_5_years_count": w5,
        "within_5_years_percent": p5,
        "within_10_years_count": w10,
        "within_10_years_percent": p10,
        "older_than_10_years_count": older,
        "older_than_10_years_percent": p_older,
        "average_publication_year": avg_yr,
        "average_source_age_years": avg_age,
        "recency_compliance_status": compliance
    }
