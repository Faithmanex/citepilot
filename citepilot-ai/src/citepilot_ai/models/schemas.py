from pydantic import BaseModel, Field
from typing import Optional


class AnalyseRequest(BaseModel):
    text: str
    citation_style: str = Field(default="apa7", pattern=r"^(apa7|apa6|harvard|vancouver|chicago-author-date|chicago-notes|mla9|ieee|oscola|turabian)$")


class AnalyseResponse(BaseModel):
    citations: list["CitationResult"]
    references: list["ReferenceResult"]
    style_warnings: list["StyleWarningResult"]


class CitationResult(BaseModel):
    raw_text: str
    paragraph_index: int
    char_start: int
    char_end: int
    context: str
    extracted_authors: list[str]
    extracted_year: Optional[int] = None
    citation_type: str = Field(default="parenthetical", pattern=r"^(parenthetical|narrative|numeric|footnote)$")
    status: str = Field(default="pending", pattern=r"^(pending|matched|possible_match|no_match)$")
    confidence: Optional[float] = None
    matched_reference_index: Optional[int] = None
    match_type: Optional[str] = None
    issues: list[dict] = Field(default_factory=list)


class ReferenceResult(BaseModel):
    raw_entry: str
    position: int
    parsed_authors: list[dict] = Field(default_factory=list)
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


class StyleWarningResult(BaseModel):
    code: str
    category: str
    message: str
    suggestion: Optional[str] = None
    severity: str = Field(default="warning", pattern=r"^(error|warning|info)$")
    paragraph_index: int = 0
    char_start: int = 0
    char_end: int = 0
    rule_source: str = Field(default="ai_powered")
    style_guide_ref: Optional[str] = None
