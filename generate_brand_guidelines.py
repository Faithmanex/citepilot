import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Palette Definition
COLOR_INK = colors.HexColor("#221D16")
COLOR_INK_SOFT = colors.HexColor("#353027")
COLOR_PAPER = colors.HexColor("#F1EBDC")
COLOR_PAPER_CARD = colors.HexColor("#FAF6EC")
COLOR_RULE = colors.HexColor("#C7BC9F")
COLOR_RED = colors.HexColor("#961E14")
COLOR_OCHRE = colors.HexColor("#825500")
COLOR_GREEN = colors.HexColor("#1E5E4B")
COLOR_BRAND = colors.HexColor("#1E3A8A")
COLOR_DARK_BG = colors.HexColor("#0F172A")
COLOR_WHITE = colors.HexColor("#FFFFFF")
COLOR_MUTED = colors.HexColor("#64748B")

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to add running headers, footers, and page numbers dynamically.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Suppress header/footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 9)
        self.setFillColor(COLOR_INK_SOFT)

        # Header
        self.drawString(54, 11 * 72 - 36, "CitePilot — Brand Identity & Editorial Guidelines")
        self.drawRightString(8.5 * 72 - 54, 11 * 72 - 36, "CONFIDENTIAL — VER. 2.0")
        self.setStrokeColor(COLOR_RULE)
        self.setLineWidth(1)
        self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)

        # Footer
        self.setFont("Helvetica", 9)
        self.setFillColor(COLOR_MUTED)
        self.drawString(54, 36, "Academic Citation & Reference Audit Platform")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * 72 - 54, 36, page_str)
        self.setStrokeColor(COLOR_RULE)
        self.setLineWidth(1)
        self.line(54, 48, 8.5 * 72 - 54, 48)

        self.restoreState()

def build_pdf(filename="CitePilot_Brand_Guidelines.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom Styles
    style_cover_title = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=32,
        leading=38,
        textColor=COLOR_PAPER_CARD,
        spaceAfter=12,
    )

    style_cover_subtitle = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=15,
        leading=22,
        textColor=colors.HexColor("#CBD5E1"),
        spaceAfter=24,
    )

    style_h1 = ParagraphStyle(
        "SectionH1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=26,
        textColor=COLOR_INK,
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True,
    )

    style_h2 = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=COLOR_BRAND,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    style_body = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=COLOR_INK_SOFT,
        spaceAfter=8,
    )

    style_body_bold = ParagraphStyle(
        "BodyDarkBold",
        parent=style_body,
        fontName="Helvetica-Bold",
    )

    style_callout = ParagraphStyle(
        "CalloutText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=10.5,
        leading=16,
        textColor=COLOR_INK,
    )

    story = []

    # ==========================================
    # PAGE 1: COVER PAGE
    # ==========================================
    cover_table_data = [
        [
            Paragraph(
                "<font color='#10B981'><b>✓ CITEPILOT OFFICIAL BRAND SYSTEM</b></font>",
                ParagraphStyle("BrandTag", fontName="Courier-Bold", fontSize=13, textColor=colors.HexColor("#10B981"))
            )
        ],
        [Spacer(1, 40)],
        [Paragraph("CitePilot", style_cover_title)],
        [Paragraph("Brand Identity & Editorial Guidelines", ParagraphStyle("Sub1", parent=style_cover_title, fontSize=24, leading=30, textColor=COLOR_WHITE))],
        [Spacer(1, 10)],
        [Paragraph("Official Standards for Brand Voice, Visual Aesthetics, Positioning Strategy, and Design System", style_cover_subtitle)],
        [Spacer(1, 120)],
        [
            Table(
                [
                    [
                        Paragraph("<b>Author:</b> CitePilot Design & Brand Team", ParagraphStyle("C1", fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#94A3B8"))),
                        Paragraph("<b>Version:</b> 2.0 (2026 Edition)", ParagraphStyle("C2", fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#94A3B8"))),
                        Paragraph("<b>Status:</b> Active Official Standard", ParagraphStyle("C3", fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#94A3B8"))),
                    ]
                ],
                colWidths=[2.2 * inch, 2.2 * inch, 2.2 * inch]
            )
        ]
    ]

    cover_box = Table(cover_table_data, colWidths=[7.0 * inch])
    cover_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_DARK_BG),
        ('PADDING', (0, 0), (-1, -1), 28),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 28),
    ]))

    story.append(cover_box)
    story.append(PageBreak())

    # ==========================================
    # PAGE 2: BRAND ESSENCE & POSITIONING
    # ==========================================
    story.append(Paragraph("1. Brand Essence & Strategic Positioning", style_h1))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_RULE, spaceBefore=4, spaceAfter=14))

    story.append(Paragraph(
        "<b>CitePilot</b> is the premiere academic manuscript verification platform designed for researchers, journal authors, PhD candidates, and university faculties. Our core mission is simple: <b>empower scholars to submit their research with complete confidence.</b>",
        style_body
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph("Competitive Positioning: CitePilot vs. ReciteWorks", style_h2))

    comp_table_data = [
        [Paragraph("<b>Dimension</b>", style_body_bold), Paragraph("<b>Legacy Competitor (ReciteWorks)</b>", style_body_bold), Paragraph("<b>CitePilot Standard</b>", style_body_bold)],
        [
            Paragraph("<b>Primary Function</b>", style_body),
            Paragraph("Basic offline regex string matching between in-text citations and bibliography text.", style_body),
            Paragraph("Comprehensive manuscript citation audit with cross-verification against global registries (Crossref, PubMed, OpenAlex, Retraction Watch).", style_body)
        ],
        [
            Paragraph("<b>Verification Depth</b>", style_body),
            Paragraph("Surface-level text string comparison only.", style_body),
            Paragraph("Metadata validation, DOI integrity check, publication year matching, and retracted paper detection.", style_body)
        ],
        [
            Paragraph("<b>User Experience</b>", style_body),
            Paragraph("Transactional, basic form interface.", style_body),
            Paragraph("Modern, editor-grade workspace with glassmorphism, concentric geometry, and multi-format exports (Word, BibTeX, RIS).", style_body)
        ],
        [
            Paragraph("<b>Brand Tone</b>", style_body),
            Paragraph("Utility-focused, mechanical tool.", style_body),
            Paragraph("Authoritative, reassuring, scholarly, and empowering (modeled after Grammarly & Turnitin).", style_body)
        ]
    ]

    comp_table = Table(comp_table_data, colWidths=[1.4 * inch, 2.7 * inch, 2.9 * inch])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_PAPER_CARD),
        ('GRID', (0, 0), (-1, -1), 1, COLOR_RULE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(comp_table)
    story.append(Spacer(1, 14))

    # Core Brand Pillars Callout
    pillars_data = [
        [
            Paragraph(
                "<b>Core Brand Pillars</b><br/>"
                "• <b>Academic Integrity:</b> Rigorous verification against official academic sources.<br/>"
                "• <b>Editor-Grade Precision:</b> Meticulous formatting and metadata inspection.<br/>"
                "• <b>Empowering & Reassuring:</b> Giving researchers total submission confidence.<br/>"
                "• <b>Scholar-First Clarity:</b> Clean, jargon-free academic communication.",
                style_callout
            )
        ]
    ]
    pillars_table = Table(pillars_data, colWidths=[7.0 * inch])
    pillars_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_PAPER_CARD),
        ('BOX', (0, 0), (-1, -1), 1.5, COLOR_BRAND),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(pillars_table)

    story.append(PageBreak())

    # ==========================================
    # PAGE 3: BRAND VOICE & EDITORIAL STANDARD
    # ==========================================
    story.append(Paragraph("2. Voice, Tone & Editorial Standards", style_h1))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_RULE, spaceBefore=4, spaceAfter=14))

    story.append(Paragraph(
        "CitePilot speaks with the voice of a <b>meticulous senior academic journal editor</b> (such as an editor at Oxford University Press or Nature). We avoid robotic developer jargon and focus on clear, reassuring outcomes for the researcher.",
        style_body
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph("Terminology Guidelines: What to Use vs. Avoid", style_h2))

    term_table_data = [
        [Paragraph("<b>Category</b>", style_body_bold), Paragraph("<b>AVOID (Tech Jargon)</b>", style_body_bold), Paragraph("<b>ADOPT (Senior Editor Voice)</b>", style_body_bold)],
        [
            Paragraph("<b>Platform Title</b>", style_body),
            Paragraph("<font color='#991B1B'>AI Citation Audit Engine</font>", style_body),
            Paragraph("<font color='#1E5E4B'><b>Academic Citation Checker / Manuscript Citation Audit</b></font>", style_body)
        ],
        [
            Paragraph("<b>Verification Action</b>", style_body),
            Paragraph("<font color='#991B1B'>Live API Database Query Pipeline</font>", style_body),
            Paragraph("<font color='#1E5E4B'><b>Cross-checked against global publisher registries</b></font>", style_body)
        ],
        [
            Paragraph("<b>Source Validation</b>", style_body),
            Paragraph("<font color='#991B1B'>Real-time DB lookup engine</font>", style_body),
            Paragraph("<font color='#1E5E4B'><b>Instant cross-verification with Crossref & PubMed</b></font>", style_body)
        ],
        [
            Paragraph("<b>Primary Call-to-Action</b>", style_body),
            Paragraph("<font color='#991B1B'>Execute Audit Task</font>", style_body),
            Paragraph("<font color='#1E5E4B'><b>Check your manuscript / Submit with confidence</b></font>", style_body)
        ]
    ]

    term_table = Table(term_table_data, colWidths=[1.5 * inch, 2.7 * inch, 2.8 * inch])
    term_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_PAPER_CARD),
        ('GRID', (0, 0), (-1, -1), 1, COLOR_RULE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(term_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Tone Benchmarks", style_h2))
    story.append(Paragraph("Our messaging is modeled after industry leaders:", style_body))
    story.append(Paragraph("• <b>Grammarly Model:</b> Reassuring, clear, outcome-focused (<i>'Write with confidence'</i>).", style_body))
    story.append(Paragraph("• <b>Turnitin Model:</b> Authoritative, integrity-driven, academic standard (<i>'Protect academic integrity'</i>).", style_body))
    story.append(Paragraph("• <b>ReciteWorks Differentiator:</b> We move beyond surface letter matching to true registry verification.", style_body))

    story.append(PageBreak())

    # ==========================================
    # PAGE 4: COLOR PALETTE & DESIGN SYSTEM
    # ==========================================
    story.append(Paragraph("3. Color Palette & Visual Design System", style_h1))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_RULE, spaceBefore=4, spaceAfter=14))

    story.append(Paragraph(
        "The CitePilot visual identity combines classic academic publishing paper textures with high-contrast, modern UI tokens. All color combinations satisfy WCAG AAA accessibility requirements.",
        style_body
    ))

    story.append(Spacer(1, 8))

    color_swatches_data = [
        [Paragraph("<b>Color Name</b>", style_body_bold), Paragraph("<b>Hex Code</b>", style_body_bold), Paragraph("<b>Usage & Context</b>", style_body_bold)],
        [Paragraph("<b>Cream Paper</b>", style_body), Paragraph("<code>#F1EBDC</code>", style_body), Paragraph("Primary landing background, classic manuscript feel.", style_body)],
        [Paragraph("<b>Paper Card</b>", style_body), Paragraph("<code>#FAF6EC</code>", style_body), Paragraph("Elevated container cards & table fills.", style_body)],
        [Paragraph("<b>Ink Dark</b>", style_body), Paragraph("<code>#221D16</code>", style_body), Paragraph("Primary typography, bold borders, high contrast.", style_body)],
        [Paragraph("<b>Academic Navy</b>", style_body), Paragraph("<code>#1E3A8A</code>", style_body), Paragraph("Brand accents, active tabs, primary buttons.", style_body)],
        [Paragraph("<b>Verified Emerald</b>", style_body), Paragraph("<code>#1E5E4B</code>", style_body), Paragraph("Verified citations, successful checks, positive badges.", style_body)],
        [Paragraph("<b>Ochre Gold</b>", style_body), Paragraph("<code>#825500</code>", style_body), Paragraph("Warning badges, page range discrepancies.", style_body)],
        [Paragraph("<b>Crimson Alert</b>", style_body), Paragraph("<code>#961E14</code>", style_body), Paragraph("Missing references, retracted literature alerts.", style_body)]
    ]

    swatch_table = Table(color_swatches_data, colWidths=[1.8 * inch, 1.4 * inch, 3.8 * inch])
    swatch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_PAPER_CARD),
        ('GRID', (0, 0), (-1, -1), 1, COLOR_RULE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 7),
    ]))

    story.append(swatch_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Visual Layout Principles", style_h2))
    story.append(Paragraph("• <b>Concentric Geometry:</b> All card containers use nested border radii matching internal elements.", style_body))
    story.append(Paragraph("• <b>2px Structural Rules:</b> Crisp 2px borders (`#C7BC9F`) anchor component boundaries.", style_body))
    story.append(Paragraph("• <b>Glassmorphism:</b> Subtle backdrop blurs (`backdrop-filter: blur(12px)`) on top navigation bars.", style_body))
    story.append(Paragraph("• <b>Focus Indicators:</b> Distinct 3px solid focus rings (`#4F46E5`) for full accessibility compliance.", style_body))

    story.append(PageBreak())

    # ==========================================
    # PAGE 5: TYPOGRAPHY & HIERARCHY
    # ==========================================
    story.append(Paragraph("4. Typography & Hierarchy System", style_h1))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_RULE, spaceBefore=4, spaceAfter=14))

    story.append(Paragraph(
        "CitePilot utilizes a curated 4-font typography system that bridges traditional manuscript proofing with modern digital dashboard legibility.",
        style_body
    ))

    story.append(Spacer(1, 8))

    type_table_data = [
        [Paragraph("<b>Font Family</b>", style_body_bold), Paragraph("<b>Classification</b>", style_body_bold), Paragraph("<b>Usage & Target</b>", style_body_bold)],
        [
            Paragraph("<b>Courier Prime</b>", style_body),
            Paragraph("Monospace Typewriter", style_body),
            Paragraph("Headlines, manuscript tags, editorial section kickers, and proof markup.", style_body)
        ],
        [
            Paragraph("<b>Inter / Manrope</b>", style_body),
            Paragraph("Modern Sans-Serif", style_body),
            Paragraph("Primary body copy, paragraph text, buttons, and navigation menus.", style_body)
        ],
        [
            Paragraph("<b>JetBrains Mono</b>", style_body),
            Paragraph("Technical Monospace", style_body),
            Paragraph("DOIs, numerical statistics, progress metrics, and BibTeX/RIS code.", style_body)
        ],
        [
            Paragraph("<b>Caveat</b>", style_body),
            Paragraph("Handwritten Script", style_body),
            Paragraph("Editorial marginalia notes, reviewer comments, and manuscript callouts.", style_body)
        ]
    ]

    type_table = Table(type_table_data, colWidths=[1.8 * inch, 1.8 * inch, 3.4 * inch])
    type_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_PAPER_CARD),
        ('GRID', (0, 0), (-1, -1), 1, COLOR_RULE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(type_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Type Hierarchy Example", style_h2))

    type_demo_data = [
        [
            Paragraph(
                "<font fontName='Helvetica-Bold' size=16 color='#221D16'>H1: Verify every citation before submission.</font><br/><br/>"
                "<font fontName='Helvetica-Bold' size=12 color='#1E3A8A'>H2: Three ways a reference list quietly fails peer review</font><br/><br/>"
                "<font fontName='Helvetica' size=10 color='#353027'>Body: CitePilot checks your manuscript for missing references, mismatched citations, and retracted sources — so you can submit your research with complete confidence.</font><br/><br/>"
                "<font fontName='Courier' size=9 color='#64748B'>// DOIs: 10.1016/j.cell.2021.04.012 · Verified in Crossref</font>",
                style_body
            )
        ]
    ]

    demo_table = Table(type_demo_data, colWidths=[7.0 * inch])
    demo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_PAPER_CARD),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_RULE),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(demo_table)

    story.append(PageBreak())

    # ==========================================
    # PAGE 6: GOVERNANCE & IMPLEMENTATION
    # ==========================================
    story.append(Paragraph("5. Brand Governance & Implementation", style_h1))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_RULE, spaceBefore=4, spaceAfter=14))

    story.append(Paragraph(
        "To maintain brand integrity across all web platforms, marketing materials, and desktop applications, adhere strictly to the following implementation checklist:",
        style_body
    ))

    story.append(Spacer(1, 6))

    gov_items = [
        "<b>1. Never Use Technical Software Jargon:</b> Always phrase capabilities in terms of researcher outcomes and editorial confidence.",
        "<b>2. Maintain High Contrast Ratios:</b> All body text must use Ink Dark (`#221D16` / `#0F172A`) against Cream Paper (`#F1EBDC` / `#FAF6EC`).",
        "<b>3. Preserve 9 Citation Style Badges:</b> Always highlight support for APA7, APA6, MLA9, Harvard, Chicago, IEEE, Vancouver, OSCOLA, and Turabian.",
        "<b>4. Consistent Call-to-Action Buttons:</b> Use 'Check your manuscript' or 'Check Manuscript' as the primary action verb across all touchpoints.",
        "<b>5. PayPal Integration Integrity:</b> Ensure all subscription buttons display official security & cancellation terms clearly."
    ]

    for item in gov_items:
        story.append(Paragraph(item, style_body))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 14))

    # Approval Signoff Block
    signoff_data = [
        [Paragraph("<b>Document Approvals & Governance</b>", style_body_bold), Paragraph("<b>Signature & Date</b>", style_body_bold)],
        [Paragraph("Brand & Product Lead", style_body), Paragraph("<i>CitePilot Brand Committee — Approved</i>", style_body)],
        [Paragraph("Lead Frontend Architect", style_body), Paragraph("<i>CitePilot Engineering — Approved</i>", style_body)],
        [Paragraph("Editorial Content Strategy", style_body), Paragraph("<i>CitePilot Content Team — Approved</i>", style_body)]
    ]

    signoff_table = Table(signoff_data, colWidths=[3.5 * inch, 3.5 * inch])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_PAPER_CARD),
        ('GRID', (0, 0), (-1, -1), 1, COLOR_RULE),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(signoff_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    output_path = sys.argv[1] if len(sys.argv) > 1 else "CitePilot_Brand_Guidelines.pdf"
    build_pdf(output_path)
