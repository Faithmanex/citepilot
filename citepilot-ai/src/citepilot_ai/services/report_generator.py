import io
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fpdf import FPDF

logger = logging.getLogger(__name__)


def _clean_pdf_text(text: str) -> str:
    """Encode unicode text safely for FPDF core Helvetica font."""
    if not text:
        return ""
    text = text.replace("•", "*").replace("❌", "[ERROR]").replace("⚠", "[WARN]").replace("ℹ", "[INFO]")
    return text.encode("latin-1", "replace").decode("latin-1")


class DiagnosticReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(30, 41, 59)
        self.cell(0, 10, _clean_pdf_text("CitePilot Academic Audit Report"), align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(100, 116, 139)
        self.cell(0, 5, _clean_pdf_text("Powered by 100% AI Dynamic Citation Analysis"), align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, _clean_pdf_text(f"Page {self.page_no()}/{{nb}} | Confidential Diagnostic Report"), align="C")


def generate_pdf_report(
    filename: str,
    citation_style: str,
    citations: List[Dict[str, Any]],
    references: List[Dict[str, Any]],
    audit_issues: List[Dict[str, Any]],
    year_distribution: Dict[str, Any]
) -> bytes:
    pdf = DiagnosticReportPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Document Details Box
    pdf.set_fill_color(241, 245, 249)
    pdf.rect(10, 30, 190, 25, style="F")
    pdf.set_xy(15, 33)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, _clean_pdf_text(f"Document: {filename or '(pasted text)'}"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(15)
    pdf.cell(0, 6, _clean_pdf_text(f"Citation Style: {citation_style.upper()}"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(15)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, _clean_pdf_text(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)

    # Summary Statistics
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 8, _clean_pdf_text("Summary Analysis"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _clean_pdf_text(f"Total In-Text Citations Found: {len(citations)}"), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, _clean_pdf_text(f"Total Reference List Entries: {len(references)}"), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, _clean_pdf_text(f"Total Issues Identified: {len(audit_issues)}"), new_x="LMARGIN", new_y="NEXT")
    if year_distribution:
        l5 = year_distribution.get("last_5_years_pct", 0)
        l10 = year_distribution.get("last_10_years_pct", 0)
        pdf.cell(0, 6, _clean_pdf_text(f"Sources in last 5 years: {l5}% | Sources in last 10 years: {l10}%"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # Issues List
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, _clean_pdf_text("Diagnostic Findings & Style Warnings"), new_x="LMARGIN", new_y="NEXT")

    if not audit_issues:
        pdf.set_font("Helvetica", "I", 10)
        pdf.set_text_color(22, 101, 52)
        pdf.cell(0, 6, _clean_pdf_text("No citation or reference errors detected. Excellent manuscript integrity!"), new_x="LMARGIN", new_y="NEXT")
    else:
        for issue in audit_issues:
            severity = issue.get("severity", "warning").lower()
            if severity == "error":
                pdf.set_text_color(185, 28, 28)
                prefix = "[ERROR]"
            elif severity == "warning":
                pdf.set_text_color(194, 65, 12)
                prefix = "[WARNING]"
            else:
                pdf.set_text_color(29, 78, 216)
                prefix = "[INFO]"

            pdf.set_font("Helvetica", "B", 10)
            label = issue.get("label", "Issue Detected")
            pdf.cell(0, 6, _clean_pdf_text(f"{prefix} {label}"), new_x="LMARGIN", new_y="NEXT")

            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(51, 65, 85)
            msg = issue.get("message", "")
            pdf.multi_cell(0, 5, _clean_pdf_text(f"Message: {msg}"))

            edu = issue.get("educational_context") or issue.get("educational_reasoning")
            if edu:
                pdf.set_font("Helvetica", "I", 8.5)
                pdf.set_text_color(100, 116, 139)
                pdf.multi_cell(0, 4.5, _clean_pdf_text(f"Rule Context: {edu}"))
            pdf.ln(3)

    return bytes(pdf.output())
