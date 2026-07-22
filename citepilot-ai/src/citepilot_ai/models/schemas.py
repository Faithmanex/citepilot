from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class AnalyseRequest(BaseModel):
    text: Optional[str] = None
    citation_style: str = Field(default="apa7", pattern=r"^(apa7|apa6|harvard|vancouver|chicago-author-date|chicago-notes|mla9|ieee|oscola|turabian)$")
    mode: str = Field(default="full")


class CitationResult(BaseModel):
    raw_text: str
    paragraph_index: int = 0
    char_start: int = 0
    char_end: int = 0
    context: str = ""
    extracted_authors: List[str] = Field(default_factory=list)
    extracted_year: Optional[int] = None
    citation_type: str = Field(default="parenthetical")
    status: str = Field(default="no_match")
    confidence: Optional[float] = 0.0
    matched_reference_index: Optional[int] = None
    match_type: Optional[str] = "none"
    issues: List[Dict[str, Any]] = Field(default_factory=list)


class ReferenceResult(BaseModel):
    raw_entry: str
    position: int = 1
    parsed_authors: List[Dict[str, Any]] = Field(default_factory=list)
    parsed_year: Optional[int] = None
    parsed_title: Optional[str] = None
    parsed_journal: Optional[str] = None
    parsed_volume: Optional[str] = None
    parsed_issue: Optional[str] = None
    parsed_pages: Optional[str] = None
    parsed_doi: Optional[str] = None
    parsed_url: Optional[str] = None
    reference_type: str = Field(default="unknown")
    status: str = Field(default="pending")
    crossref_validation: Dict[str, Any] = Field(default_factory=dict)
    retraction_info: Dict[str, Any] = Field(default_factory=dict)


class StyleWarningResult(BaseModel):
    code: str
    category: str
    message: str
    suggestion: Optional[str] = None
    severity: str = Field(default="warning")
    paragraph_index: int = 0
    char_start: int = 0
    char_end: int = 0
    rule_source: str = Field(default="ai_powered")
    style_guide_ref: Optional[str] = None


class AnalyseResponse(BaseModel):
    mode: str = Field(default="full")
    elapsed_seconds: float = Field(default=0.0)
    citations: List[CitationResult] = Field(default_factory=list)
    references: List[ReferenceResult] = Field(default_factory=list)
    style_warnings: List[StyleWarningResult] = Field(default_factory=list)
    uncited_claims: List[Dict[str, Any]] = Field(default_factory=list)
    recency: Dict[str, Any] = Field(default_factory=dict)


class PdfExportRequest(BaseModel):
    data: Dict[str, Any] = Field(..., description="Analysis data containing citations, references, style_warnings, recency")


class DocxExportRequest(BaseModel):
    text: str = Field(default="", description="Original manuscript text")
    analysis_data: Dict[str, Any] = Field(default_factory=dict, description="Analysis data")


# LLM Response Validation Schemas

class ExtractedCitationItem(BaseModel):
    raw_text: str = ""
    paragraph_index: int = 0
    char_start: int = 0
    char_end: int = 0
    context: str = ""
    extracted_authors: List[str] = Field(default_factory=list)
    extracted_year: Optional[int] = None
    citation_type: str = Field(default="parenthetical")


class CitationsResponseSchema(BaseModel):
    citations: List[ExtractedCitationItem] = Field(default_factory=list)


class ParsedAuthorItem(BaseModel):
    family: Optional[str] = None
    given: Optional[str] = None


class ParsedReferenceItem(BaseModel):
    raw_entry: str = ""
    position: int = 1
    parsed_authors: List[Dict[str, Any]] = Field(default_factory=list)
    parsed_year: Optional[int] = None
    parsed_title: Optional[str] = None
    parsed_journal: Optional[str] = None
    parsed_volume: Optional[str] = None
    parsed_issue: Optional[str] = None
    parsed_pages: Optional[str] = None
    parsed_doi: Optional[str] = None
    parsed_url: Optional[str] = None
    reference_type: str = Field(default="unknown")


class ReferencesResponseSchema(BaseModel):
    references: List[ParsedReferenceItem] = Field(default_factory=list)


class CitationMatchIssue(BaseModel):
    type: Optional[str] = None
    code: Optional[str] = None
    message: Optional[str] = None
    severity: str = "warning"


class CitationMatchItem(BaseModel):
    citation_raw_text: str = ""
    matched_reference_index: Optional[int] = None
    matched_reference_text: Optional[str] = None
    match_type: str = Field(default="none")
    confidence: float = Field(default=0.0)
    author_score: Optional[float] = None
    year_score: Optional[float] = None
    issues: List[Dict[str, Any]] = Field(default_factory=list)


class MatchesResponseSchema(BaseModel):
    matches: List[CitationMatchItem] = Field(default_factory=list)


class StyleWarningItem(BaseModel):
    code: str = "STYLE_WARNING"
    category: str = "formatting"
    target_text: str = ""
    message: str = ""
    suggestion: Optional[str] = None
    severity: str = "warning"


class StyleWarningsResponseSchema(BaseModel):
    style_warnings: List[StyleWarningItem] = Field(default_factory=list)


class UncitedClaimItem(BaseModel):
    paragraph_index: int = 0
    claim_text: str = ""
    reason: str = ""
    severity: str = "warning"


class UncitedClaimsResponseSchema(BaseModel):
    uncited_claims: List[UncitedClaimItem] = Field(default_factory=list)

