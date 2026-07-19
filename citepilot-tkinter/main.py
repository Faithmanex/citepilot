import json
import logging
import os
import re
import threading
import time
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from tkinter.scrolledtext import ScrolledText

from openai import OpenAI

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = "deepseek-v4-flash"

CITATION_STYLES = [
    "apa7", "apa6", "harvard", "vancouver", "chicago-author-date",
    "chicago-notes", "mla9", "ieee", "oscola", "turabian",
]

SYSTEM_PROMPTS = {
    "citations": """You are an absolute, deterministic academic citation parser.
Extract ALL in-text citations from the body text only in sequential appearance order.
Do NOT omit any citations. Do NOT add subjective comments.
Return a JSON object with a "citations" array sorted by paragraph_index and char_start.
Each citation object MUST contain:
  "raw_text": exact citation text,
  "paragraph_index": int (0-based),
  "char_start": int,
  "char_end": int,
  "context": string (~80 chars around citation),
  "extracted_authors": array of author family surnames,
  "extracted_year": int or null,
  "citation_type": "parenthetical" | "narrative" | "numeric" | "footnote" """,

    "references": """You are an absolute, deterministic bibliographic reference parser.
Parse every reference entry in the bibliography in strict sequential order.
Return a JSON object with a "references" array sorted by position.
Each reference object MUST contain:
  "raw_entry": exact full reference text,
  "position": int (0-based position in reference list),
  "parsed_authors": array of {"family": string, "given": string},
  "parsed_year": int or null,
  "parsed_title": string or null,
  "parsed_journal": string or null,
  "parsed_volume": string or null,
  "parsed_issue": string or null,
  "parsed_pages": string or null,
  "parsed_doi": string or null,
  "parsed_url": string or null,
  "reference_type": "journal_article" | "book" | "chapter" | "conference" | "thesis" | "website" | "report" | "other" """,

    "matching": """You are an absolute, deterministic citation matching system.
Perform exact and fuzzy bidirectional matching between in-text citations and reference list items.
Return a JSON object with a "matches" array. Each match MUST contain:
  "citation_raw_text": exact string,
  "matched_reference_index": int (0-based index in references array, or null if missing),
  "matched_reference_text": string or null,
  "match_type": "exact" | "fuzzy" | "ai_verified" | "none",
  "confidence": float (0.0 to 1.0),
  "issues": array of {"type": string, "code": string, "message": string, "severity": "error"|"warning"|"info"} """,

    "style": """You are a dynamic, context-aware academic document auditor and style compliance system.
Perform a holistic context-aware evaluation of the manuscript text for the specified style guide.

DYNAMIC ANALYSIS GUIDELINES (Zero Hardcoded Rules):
1. Document Structure & Front Matter:
   - Dynamically evaluate if title page or front matter elements are incomplete (e.g., paper title present but author name or institutional affiliation omitted).
   - Detect placeholder text, template markers, or bracketed instructions (e.g., "[Insert Table of Contents here]", "[Author Name]", "TBD").
2. Citation & Bibliography Syntax:
   - Audit style-specific "et al." usage rules, citation ordering inside parenthetical citations, bibliography alphabetization, and quote page numbers.

Return a JSON object with a "style_warnings" array sorted deterministically by category and message.
Each warning object MUST contain:
  "code": string rule code synthesized dynamically from context,
  "category": "formatting" | "content" | "style_warning" | "document_structure" | "missing_reference" | "author_spelling_mismatch" | "year_mismatch",
  "message": clear context-aware description of the observed issue,
  "suggestion": actionable educational recommendation explaining how to resolve it,
  "severity": "error" | "warning" | "info",
  "paragraph_index": int,
  "char_start": int,
  "char_end": int """,
}


def _clean_pdf_text(text: str) -> str:
    """Encode unicode text safely for FPDF core Helvetica font."""
    if not text:
        return ""
    text = text.replace("•", "*").replace("❌", "[ERROR]").replace("⚠", "[WARN]").replace("ℹ", "[INFO]")
    return text.encode("latin-1", "replace").decode("latin-1")


def extract_json(text: str) -> dict:
    text = text.strip()
    m = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if m:
        text = m.group(1).strip()
    return json.loads(text)


def call_deepseek(prompt: str, system: str, api_key: str) -> dict:
    if not api_key.strip():
        raise ValueError("DeepSeek API key is empty. Set DEEPSEEK_API_KEY in .env or enter it above.")
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
    try:
        response = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_tokens=384000,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        msg = str(e)
        if "401" in msg or "unauthorized" in msg.lower() or "invalid" in msg.lower():
            raise ValueError("Invalid DeepSeek API key. Check your key at https://platform.deepseek.com")
        if "quota" in msg.lower() or "insufficient" in msg.lower() or "429" in msg:
            raise ValueError("DeepSeek API quota exceeded. Check your billing.")
        raise ValueError(f"DeepSeek API error: {msg}")

    if not response.choices or not response.choices[0].message:
        raise ValueError("DeepSeek returned empty choices.")

    raw = response.choices[0].message.content
    if not raw or not raw.strip():
        raise ValueError("DeepSeek returned empty content.")

    try:
        return extract_json(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"DeepSeek returned non-JSON response: {raw[:300]}") from e


def read_file(path: str) -> tuple[str | None, str | None]:
    ext = os.path.splitext(path)[1].lower()
    try:
        if ext == ".txt":
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                return f.read(), None
        elif ext == ".pdf":
            try:
                from PyPDF2 import PdfReader
            except ImportError:
                return None, "PyPDF2 not installed. Run: pip install PyPDF2"
            reader = PdfReader(path)
            return "\n".join(page.extract_text() or "" for page in reader.pages), None
        elif ext == ".docx":
            try:
                from docx import Document
            except ImportError:
                return None, "python-docx not installed. Run: pip install python-docx"
            doc = Document(path)
            return "\n".join(p.text for p in doc.paragraphs), None
        else:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                return f.read(), None
    except Exception as e:
        return None, f"Cannot read {os.path.basename(path)}: {e}"


def calculate_year_stats(refs: list) -> dict:
    years = []
    current_year = 2026
    for r in refs:
        y = r.get("parsed_year")
        if isinstance(y, int) and 1800 <= y <= current_year + 1:
            years.append(y)

    total = len(years)
    if total == 0:
        return {"total": 0, "last_5_pct": 0.0, "last_10_pct": 0.0}

    l5 = sum(1 for y in years if current_year - y <= 5)
    l10 = sum(1 for y in years if current_year - y <= 10)
    return {
        "total": total,
        "last_5_pct": round((l5 / total) * 100, 1),
        "last_10_pct": round((l10 / total) * 100, 1),
    }


def analyze_document(text: str, citation_style: str, api_key: str,
                     progress: callable, done: callable):
    try:
        print(f"\n[CitePilot Terminal Log] === Starting Manuscript Audit ({citation_style.upper()}) ===", flush=True)
        progress("Sending to AI Model...")
        text_truncated = text[:80000]

        print(f"[CitePilot Terminal Log] 1/4 Extracting in-text citations...", flush=True)
        progress("Extracting in-text citations...")
        cit_result = call_deepseek(
            f"Extract all in-text citations from this {citation_style} document:\n\n{text_truncated}",
            SYSTEM_PROMPTS["citations"], api_key)
        citations = cit_result.get("citations", [])
        print(f"[CitePilot Terminal Log] -> Extracted {len(citations)} in-text citations.", flush=True)
        time.sleep(0.3)

        print(f"[CitePilot Terminal Log] 2/4 Parsing reference list...", flush=True)
        progress("Parsing reference list...")
        ref_result = call_deepseek(
            f"Find and parse the reference list from this {citation_style} document:\n\n{text_truncated}",
            SYSTEM_PROMPTS["references"], api_key)
        refs = ref_result.get("references", [])
        print(f"[CitePilot Terminal Log] -> Parsed {len(refs)} reference entries.", flush=True)
        time.sleep(0.3)

        print(f"[CitePilot Terminal Log] 3/4 Bidirectional citation matching...", flush=True)
        progress("Matching citations to references...")
        if citations and refs:
            match_result = call_deepseek(
                json.dumps({"citations": citations, "references": refs}),
                SYSTEM_PROMPTS["matching"], api_key)
            matches = match_result.get("matches", [])
            print(f"[CitePilot Terminal Log] -> Matched {len(matches)} citations to bibliography items.", flush=True)
            match_by_text = {m.get("citation_raw_text", "").strip().lower(): m for m in matches}
            for c in citations:
                key = c.get("raw_text", "").strip().lower()
                m = match_by_text.get(key)
                if m:
                    idx = m.get("matched_reference_index")
                    c["status"] = "matched"
                    c["confidence"] = m.get("confidence", 0.5)
                    c["match_type"] = m.get("match_type", "ai_verified")
                    c["matched_reference_index"] = idx
                    c["issues"] = m.get("issues", [])
                    if idx is not None and idx < len(refs):
                        refs[idx]["status"] = "cited"
                else:
                    c["status"] = "no_match"
            for r in refs:
                if r.get("status") != "cited":
                    r["status"] = "orphaned"
        time.sleep(0.3)

        print(f"[CitePilot Terminal Log] 4/4 Auditing citation style compliance...", flush=True)
        progress("Auditing citation style...")
        style_result = call_deepseek(
            f"Check style of this {citation_style} document:\n\n{text_truncated[:20000]}",
            SYSTEM_PROMPTS["style"], api_key)
        warnings = style_result.get("style_warnings", [])
        print(f"[CitePilot Terminal Log] -> Identified {len(warnings)} diagnostic style issues.", flush=True)

        progress("Done!")
        print(f"[CitePilot Terminal Log] === Audit Complete ===\n", flush=True)
        done(citations, refs, warnings)
    except Exception as e:
        print(f"[CitePilot Terminal Log ERROR] Analysis failed: {e}", flush=True)
        done(None, None, None, str(e))


def analyze_references_only(text: str, citation_style: str, api_key: str,
                            progress: callable, done: callable):
    try:
        print(f"\n[CitePilot Terminal Log] === Starting Reference-Only Audit ({citation_style.upper()}) ===", flush=True)
        progress("Parsing standalone reference list...")
        ref_result = call_deepseek(
            f"Parse the following standalone reference list for {citation_style}:\n\n{text[:40000]}",
            SYSTEM_PROMPTS["references"], api_key)
        refs = ref_result.get("references", [])
        print(f"[CitePilot Terminal Log] -> Parsed {len(refs)} standalone reference entries.", flush=True)
        progress("Done!")
        print(f"[CitePilot Terminal Log] === Reference Audit Complete ===\n", flush=True)
        done([], refs, [])
    except Exception as e:
        print(f"[CitePilot Terminal Log ERROR] Reference audit failed: {e}", flush=True)
        done(None, None, None, str(e))


def export_pdf(path: str, filename: str, style: str,
               citations: list, refs: list, warnings: list):
    from fpdf import FPDF

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, _clean_pdf_text("CitePilot Academic Audit Report"), align="C")
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _clean_pdf_text(f"Document: {filename or '(pasted text)'}"))
    pdf.ln(5)
    pdf.cell(0, 6, _clean_pdf_text(f"Citation Style: {style.upper()}"))
    pdf.ln(5)
    from datetime import datetime
    pdf.cell(0, 6, _clean_pdf_text(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"))
    pdf.ln(10)

    matched = sum(1 for c in citations if c.get("status") == "matched")
    no_match = sum(1 for c in citations if c.get("status") == "no_match")
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, _clean_pdf_text(f"Summary: {len(citations)} citations, {len(refs)} references, {len(warnings)} style warnings"))
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _clean_pdf_text(f"  Matched: {matched}  |  Unmatched: {no_match}"))
    pdf.ln(10)

    if citations:
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, _clean_pdf_text(f"In-Text Citations ({len(citations)})"))
        pdf.ln(6)
        pdf.set_font("Helvetica", "", 9)
        for i, c in enumerate(citations):
            status = c.get("status", "pending")
            raw = _clean_pdf_text(c.get("raw_text", ""))
            authors = _clean_pdf_text(", ".join(c.get("extracted_authors", [])) or "N/A")
            year = c.get("extracted_year", "N/A")
            conf = c.get("confidence", "N/A")
            pdf.multi_cell(0, 5, _clean_pdf_text(f"[{i}] {raw}"))
            pdf.set_font("Helvetica", "I", 8)
            pdf.cell(0, 4, _clean_pdf_text(f"     Authors: {authors}  Year: {year}  Status: {status}  Confidence: {conf}"))
            pdf.ln(4)
            pdf.set_font("Helvetica", "", 9)

    if refs:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, _clean_pdf_text(f"Reference List ({len(refs)})"))
        pdf.ln(6)
        pdf.set_font("Helvetica", "", 8)
        for i, r in enumerate(refs):
            entry = _clean_pdf_text(r.get("raw_entry", ""))
            status = r.get("status", "pending")
            pdf.multi_cell(0, 5, _clean_pdf_text(f"[{i}] {entry}  [{status.upper()}]"))
            pdf.ln(3)

    if warnings:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, _clean_pdf_text(f"Diagnostic Findings & Warnings ({len(warnings)})"))
        pdf.ln(6)
        pdf.set_font("Helvetica", "", 9)
        for w in warnings:
            sev = w.get("severity", "info")
            label = {"error": "[ERROR]", "warning": "[WARN]", "info": "[INFO]"}.get(sev, "[INFO]")
            cat = _clean_pdf_text(w.get("category", ""))
            msg = _clean_pdf_text(w.get("message", ""))
            sug = _clean_pdf_text(w.get("suggestion", ""))
            pdf.set_font("Helvetica", "B", 9)
            pdf.multi_cell(0, 5, _clean_pdf_text(f"{label} {cat}: {msg}"))
            if sug:
                pdf.set_font("Helvetica", "I", 8)
                pdf.multi_cell(0, 4, _clean_pdf_text(f"  Suggestion: {sug}"))
            pdf.ln(3)

    pdf.output(path)


class CitePilotApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("CitePilot Academic Auditor")
        self.root.geometry("1000x750")
        self.root.minsize(800, 600)
        self.filename = None
        self.citations = []
        self.refs = []
        self.warnings = []
        self.build_ui()

    def build_ui(self):
        main = ttk.Frame(self.root, padding=12)
        main.pack(fill="both", expand=True)

        top = ttk.Frame(main)
        top.pack(fill="x", pady=(0, 8))
        ttk.Label(top, text="CitePilot Academic Suite", font=("Segoe UI", 18, "bold")).pack(side="left")
        ttk.Label(top, text="[100% AI Dynamic Audit Engine]", font=("Segoe UI", 10, "italic"), foreground="#38bdf8").pack(side="left", padx=10)

        key_frame = ttk.Frame(main)
        key_frame.pack(fill="x", pady=4)
        ttk.Label(key_frame, text="API Key:").pack(side="left")
        self.key_var = tk.StringVar(value=DEEPSEEK_API_KEY)
        key_entry = ttk.Entry(key_frame, textvariable=self.key_var, width=50, show="*")
        key_entry.pack(side="left", padx=6, fill="x", expand=True)
        ttk.Button(key_frame, text="Toggle Key",
                   command=lambda: key_entry.configure(show="") if key_entry.cget("show") else key_entry.configure(show="*")
                   ).pack(side="left")

        input_frame = ttk.LabelFrame(main, text="Manuscript / Document Source", padding=8)
        input_frame.pack(fill="both", pady=4)

        btn_row = ttk.Frame(input_frame)
        btn_row.pack(fill="x", pady=(0, 4))
        ttk.Button(btn_row, text="Open File (PDF/DOCX/TXT)", command=self.pick_file).pack(side="left", padx=(0, 6))
        self.file_label = ttk.Label(btn_row, text="", foreground="gray")
        self.file_label.pack(side="left")

        self.text_widget = ScrolledText(input_frame, height=7, wrap="word", font=("Consolas", 10))
        self.text_widget.pack(fill="both", expand=True)
        self.text_widget.insert("1.0", "Paste manuscript text or reference list here...")
        self.text_widget.bind("<FocusIn>", lambda e: self.text_widget.delete("1.0", "end")
                              if self.text_widget.get("1.0", "end-1c") == "Paste manuscript text or reference list here..." else None)

        opt_frame = ttk.Frame(main)
        opt_frame.pack(fill="x", pady=4)

        ttk.Label(opt_frame, text="Citation Style:").pack(side="left")
        self.style_var = tk.StringVar(value="apa7")
        style_menu = ttk.Combobox(opt_frame, textvariable=self.style_var, values=CITATION_STYLES, state="readonly", width=18)
        style_menu.pack(side="left", padx=6)

        self.stat_label = ttk.Label(opt_frame, text="Last 5 Years: 0.0% | Last 10 Years: 0.0%", font=("Segoe UI", 9, "bold"), foreground="#10b981")
        self.stat_label.pack(side="left", padx=15)

        self.export_btn = ttk.Button(opt_frame, text="Export PDF", command=self.export_results, state="disabled")
        self.export_btn.pack(side="right", padx=(4, 0))
        self.btn_ref_only = ttk.Button(opt_frame, text="Audit Ref-Only", command=self.start_ref_only_analysis)
        self.btn_ref_only.pack(side="right", padx=4)
        self.analyze_btn = ttk.Button(opt_frame, text="Analyze Manuscript", command=self.start_analysis)
        self.analyze_btn.pack(side="right")

        self.progress_label = ttk.Label(opt_frame, text="", foreground="#38bdf8", font=("Segoe UI", 9, "italic"))
        self.progress_label.pack(side="right", padx=(0, 8))

        self.notebook = ttk.Notebook(main)
        self.notebook.pack(fill="both", expand=True, pady=(4, 0))

        self.citations_tab = ttk.Frame(self.notebook)
        self.refs_tab = ttk.Frame(self.notebook)
        self.warnings_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.citations_tab, text="In-Text Citations")
        self.notebook.add(self.refs_tab, text="Reference List & Metadata")
        self.notebook.add(self.warnings_tab, text="Diagnostic Findings")

        self.cit_text = ScrolledText(self.citations_tab, wrap="word", font=("Consolas", 10))
        self.cit_text.pack(fill="both", expand=True)
        self.cit_text.tag_configure("green", foreground="green")
        self.cit_text.tag_configure("red", foreground="red")

        self.ref_text = ScrolledText(self.refs_tab, wrap="word", font=("Consolas", 10))
        self.ref_text.pack(fill="both", expand=True)
        self.ref_text.tag_configure("green", foreground="green")
        self.ref_text.tag_configure("red", foreground="red")

        self.warn_text = ScrolledText(self.warnings_tab, wrap="word", font=("Consolas", 10))
        self.warn_text.pack(fill="both", expand=True)
        self.warn_text.tag_configure("orange", foreground="#CC7000")
        self.warn_text.tag_configure("red", foreground="red")
        self.warn_text.tag_configure("green", foreground="green")

    def pick_file(self):
        path = filedialog.askopenfilename(
            filetypes=[("Documents", "*.pdf *.docx *.txt"), ("All files", "*.*")])
        if not path:
            return
        self.file_label.config(text=os.path.basename(path))
        text, err = read_file(path)
        if err:
            messagebox.showerror("Read Error", err)
            return
        self.text_widget.delete("1.0", "end")
        self.text_widget.insert("1.0", text)
        self.filename = os.path.basename(path)
        self.root.title(f"CitePilot — {self.filename}")

    def start_analysis(self):
        api_key = self.key_var.get().strip()
        if not api_key:
            messagebox.showerror("API Key Required", "Please enter your AI API key above.")
            return
        text = self.text_widget.get("1.0", "end-1c").strip()
        if not text or text == "Paste manuscript text or reference list here...":
            messagebox.showerror("No Content", "Open a file or paste document text.")
            return
        style = self.style_var.get()
        self.analyze_btn.config(state="disabled", text="Analyzing...")
        self.btn_ref_only.config(state="disabled")
        self.export_btn.config(state="disabled")
        self.progress_label.config(text="Starting audit...")
        self.cit_text.delete("1.0", "end")
        self.ref_text.delete("1.0", "end")
        self.warn_text.delete("1.0", "end")

        def on_done(citations, refs, warnings, error=None):
            self.root.after(0, lambda: self.show_results(citations, refs, warnings, error))

        t = threading.Thread(target=analyze_document, args=(
            text, style, api_key, self.set_progress, on_done), daemon=True)
        t.start()

    def start_ref_only_analysis(self):
        api_key = self.key_var.get().strip()
        if not api_key:
            messagebox.showerror("API Key Required", "Please enter your AI API key above.")
            return
        text = self.text_widget.get("1.0", "end-1c").strip()
        if not text or text == "Paste manuscript text or reference list here...":
            messagebox.showerror("No Content", "Paste reference list entries first.")
            return
        style = self.style_var.get()
        self.btn_ref_only.config(state="disabled", text="Auditing...")
        self.analyze_btn.config(state="disabled")
        self.export_btn.config(state="disabled")
        self.progress_label.config(text="Parsing references...")
        self.cit_text.delete("1.0", "end")
        self.ref_text.delete("1.0", "end")
        self.warn_text.delete("1.0", "end")

        def on_done(citations, refs, warnings, error=None):
            self.root.after(0, lambda: self.show_results(citations, refs, warnings, error))

        t = threading.Thread(target=analyze_references_only, args=(
            text, style, api_key, self.set_progress, on_done), daemon=True)
        t.start()

    def set_progress(self, msg):
        self.root.after(0, lambda: self.progress_label.config(text=msg))

    def show_results(self, citations, refs, warnings, error=None):
        self.analyze_btn.config(state="normal", text="Analyze Manuscript")
        self.btn_ref_only.config(state="normal", text="Audit Ref-Only")
        self.progress_label.config(text="")
        if error:
            messagebox.showerror("Analysis Error", error)
            return

        self.citations, self.refs, self.warnings = citations, refs, warnings
        self.export_btn.config(state="normal")

        stats = calculate_year_stats(refs)
        self.stat_label.config(text=f"Last 5 Yrs: {stats['last_5_pct']}% | Last 10 Yrs: {stats['last_10_pct']}% (Total: {stats['total']})")

        cit_txt = self.cit_text
        cit_txt.insert("end", f"Total In-Text Citations Found: {len(citations)}\n", "bold")
        cit_txt.insert("end", "=" * 60 + "\n\n")
        for i, c in enumerate(citations):
            status = c.get("status", "pending")
            colour = "green" if status == "matched" else "red"
            cit_txt.insert("end", f"[{i}] {c.get('raw_text', '')}\n")
            cit_txt.insert("end", f"     Authors: {', '.join(c.get('extracted_authors', [])) or 'N/A'}\n")
            cit_txt.insert("end", f"     Year: {c.get('extracted_year', 'N/A')}  |  Type: {c.get('citation_type', 'N/A')}  |  Status: ")
            cit_txt.insert("end", f"{status.upper()}\n", colour)
            cit_txt.insert("end", f"     Confidence: {c.get('confidence', 'N/A')}\n\n")

        ref_txt = self.ref_text
        ref_txt.insert("end", f"Total Reference Entries Found: {len(refs)}\n", "bold")
        ref_txt.insert("end", "=" * 60 + "\n\n")
        for i, r in enumerate(refs):
            status = r.get("status", "pending")
            colour = "green" if status == "cited" else "red"
            ref_txt.insert("end", f"[{i}] {r.get('raw_entry', '')}\n")
            ref_txt.insert("end", f"     Year: {r.get('parsed_year', 'N/A')} | DOI: {r.get('parsed_doi', 'N/A')} | Status: ")
            ref_txt.insert("end", f"{status.upper()}\n", colour)
            ref_txt.insert("end", "\n")

        warn_txt = self.warn_text
        warn_txt.insert("end", f"Total Diagnostic Warnings & Issues: {len(warnings)}\n", "bold")
        warn_txt.insert("end", "=" * 60 + "\n\n")
        for w in warnings:
            sev = w.get("severity", "info")
            colour = {"error": "red", "warning": "orange", "info": "green"}.get(sev, "")
            label = {"error": "[ERROR]", "warning": "[WARN]", "info": "[INFO]"}.get(sev, "[INFO]")
            start = warn_txt.index("end-1c")
            warn_txt.insert("end", f"{label} {w.get('category', '')}: {w.get('message', '')}\n")
            end = warn_txt.index("end-1c")
            if colour:
                warn_txt.tag_add(colour, start, end)
            if w.get("suggestion"):
                warn_txt.insert("end", f"     Suggestion: {w['suggestion']}\n")
            warn_txt.insert("end", "\n")

        self.notebook.select(0)

    def export_results(self):
        if not self.citations and not self.refs and not self.warnings:
            return
        path = filedialog.asksaveasfilename(
            defaultextension=".pdf",
            filetypes=[("PDF files", "*.pdf")],
            initialfile=f"citepilot_report_{self.filename or 'document'}.pdf")
        if not path:
            return
        try:
            export_pdf(path, self.filename or "document", self.style_var.get(),
                       self.citations, self.refs, self.warnings)
            os.startfile(path)
        except Exception as e:
            messagebox.showerror("Export Failed", str(e))

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    app = CitePilotApp()
    app.run()
