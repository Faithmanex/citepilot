from openai import OpenAI
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import threading
import json
import os
import re
import time

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = "deepseek-v4-flash"

CITATION_STYLES = [
    "apa7", "apa6", "harvard", "vancouver", "chicago-author-date",
    "chicago-notes", "mla9", "ieee", "oscola", "turabian",
]

SYSTEM_PROMPTS = {
    "citations": """You are an expert academic citation parser.
The document below includes both body text and a reference list.
Extract ALL in-text citations from the body text only (ignore text after "References"/"Bibliography"/"Works Cited").
Return a JSON object with a "citations" array. Each citation has:
  raw_text, paragraph_index (0-based), char_start, char_end,
  context (surrounding text), extracted_authors (array of strings),
  extracted_year (int or null), citation_type ("parenthetical"|"narrative"|"numeric"|"footnote")""",

    "references": """You are an expert bibliographic reference parser.
The document includes both body text and a reference list.
Find the reference list section (after "References"/"Bibliography"/"Works Cited") and parse each entry.
Return a JSON object with a "references" array. Each reference has:
  raw_entry, position (0-based), parsed_authors (array of {family,given}),
  parsed_year (int or null), parsed_title, parsed_journal,
  parsed_volume, parsed_issue, parsed_pages, parsed_doi,
  parsed_url (null or string), reference_type""",

    "matching": """You are an expert citation matching system.
Match each in-text citation to its corresponding reference entry.
Return a JSON object with a "matches" array. Each match has:
  citation_raw_text, matched_reference_index (int, position in refs array),
  matched_reference_text, match_type ("exact"|"fuzzy"|"ai_verified"|"none"),
  confidence (0-1), issues (array of {type, code, message, severity})""",

    "style": """You are an expert citation style checker.
Check the document for citation style consistency issues.
Return a JSON object with a "style_warnings" array. Each warning has:
  code, category, message, suggestion (or null), severity ("error"|"warning"|"info"),
  paragraph_index (int), char_start (int), char_end (int)""",
}


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
            temperature=0.1,
            max_tokens=384000,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        msg = str(e)
        m = msg
        if "401" in m or "unauthorized" in m.lower() or "invalid" in m.lower():
            raise ValueError("Invalid DeepSeek API key. Check your key at https://platform.deepseek.com")
        if "quota" in m.lower() or "insufficient" in m.lower() or "429" in m:
            raise ValueError("DeepSeek API quota exceeded. Check your billing.")
        if "model" in m.lower() and "not" in m.lower():
            raise ValueError(f"Model '{DEEPSEEK_MODEL}' not found or not accessible.")
        raise ValueError(f"DeepSeek API error: {m}")

    if not response.choices or not response.choices[0].message:
        raise ValueError(f"DeepSeek returned no choices. Response: {response}")

    raw = response.choices[0].message.content
    if not raw or not raw.strip():
        raise ValueError(f"DeepSeek returned empty content. Finish reason: {response.choices[0].finish_reason}")

    try:
        return extract_json(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"DeepSeek returned non-JSON. Finish: {response.choices[0].finish_reason}. First 300: {raw[:300]}") from e


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
    except FileNotFoundError:
        return None, f"File not found: {path}"
    except PermissionError:
        return None, f"Permission denied: {path}"
    except Exception as e:
        return None, f"Cannot read {os.path.basename(path)}: {e}"


def analyze_document(text: str, citation_style: str, api_key: str,
                     progress: callable, done: callable):
    try:
        progress("Sending to DeepSeek...")
        text_truncated = text[:80000]

        progress("Extracting citations...")
        cit_result = call_deepseek(
            f"Extract all in-text citations from this {citation_style} document:\n\n{text_truncated}",
            SYSTEM_PROMPTS["citations"], api_key)
        citations = cit_result.get("citations", [])
        time.sleep(0.5)

        progress("Parsing references...")
        ref_result = call_deepseek(
            f"Find and parse the reference list from this {citation_style} document:\n\n{text_truncated}",
            SYSTEM_PROMPTS["references"], api_key)
        refs = ref_result.get("references", [])
        time.sleep(0.5)

        progress("Matching citations to references...")
        if citations and refs:
            match_result = call_deepseek(
                json.dumps({"citations": citations, "references": refs}),
                SYSTEM_PROMPTS["matching"], api_key)
            matches = match_result.get("matches", [])
            match_by_text = {}
            for m in matches:
                key = m.get("citation_raw_text", "").strip().lower()
                match_by_text[key] = m
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
        time.sleep(0.5)

        progress("Checking style...")
        style_result = call_deepseek(
            f"Check style of this {citation_style} document:\n\n{text_truncated[:20000]}",
            SYSTEM_PROMPTS["style"], api_key)
        warnings = style_result.get("style_warnings", [])

        progress("Done!")
        done(citations, refs, warnings)
    except Exception as e:
        done(None, None, None, str(e))


def export_pdf(path: str, filename: str, style: str,
               citations: list, refs: list, warnings: list):
    from fpdf import FPDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "CitePilot Analysis Report", align="C")
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Document: {filename or '(pasted text)'}")
    pdf.ln(5)
    pdf.cell(0, 6, f"Citation Style: {style}")
    pdf.ln(5)
    from datetime import datetime
    pdf.cell(0, 6, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    pdf.ln(10)

    matched = sum(1 for c in citations if c.get("status") == "matched")
    no_match = sum(1 for c in citations if c.get("status") == "no_match")
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, f"Summary: {len(citations)} citations, {len(refs)} references, {len(warnings)} style warnings")
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"  Matched: {matched}  |  Unmatched: {no_match}")
    pdf.ln(10)

    if citations:
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, f"Citations ({len(citations)})")
        pdf.ln(6)
        pdf.set_font("Helvetica", "", 9)
        for i, c in enumerate(citations):
            status = c.get("status", "pending")
            raw = c.get("raw_text", "")
            authors = ", ".join(c.get("extracted_authors", [])) or "N/A"
            year = c.get("extracted_year", "N/A")
            conf = c.get("confidence", "N/A")
            if len(raw) > 80:
                raw = raw[:77] + "..."
            pdf.multi_cell(0, 5, f"[{i}] {raw}")
            pdf.set_font("Helvetica", "I", 8)
            pdf.cell(0, 4, f"     Authors: {authors}  Year: {year}  Status: {status}  Confidence: {conf}")
            pdf.ln(4)
            pdf.set_font("Helvetica", "", 9)

    if refs:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, f"References ({len(refs)})")
        pdf.ln(6)
        pdf.set_font("Helvetica", "", 8)
        for i, r in enumerate(refs):
            entry = r.get("raw_entry", "")
            if len(entry) > 100:
                entry = entry[:97] + "..."
            status = r.get("status", "pending")
            pdf.cell(0, 5, f"[{i}] {entry}  [{status}]")
            pdf.ln(5)

    if warnings:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, f"Style Warnings ({len(warnings)})")
        pdf.ln(6)
        pdf.set_font("Helvetica", "", 9)
        for w in warnings:
            sev = w.get("severity", "info")
            label = {"error": "[ERROR]", "warning": "[WARN]", "info": "[INFO]"}.get(sev, "[INFO]")
            cat = w.get("category", "")
            msg = w.get("message", "")
            sug = w.get("suggestion", "")
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(0, 5, f"{label} {cat}: {msg}")
            pdf.ln(5)
            if sug:
                pdf.set_font("Helvetica", "I", 8)
                pdf.cell(0, 4, f"  Suggestion: {sug}")
                pdf.ln(4)

    pdf.output(path)


class CitePilotApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("CitePilot")
        self.root.geometry("900x700")
        self.root.minsize(700, 500)
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
        ttk.Label(top, text="CitePilot", font=("Segoe UI", 18, "bold")).pack(side="left")
        ttk.Label(top, text=f"[DeepSeek] ({DEEPSEEK_MODEL})", font=("Segoe UI", 10), foreground="gray").pack(side="left", padx=8)

        key_frame = ttk.Frame(main)
        key_frame.pack(fill="x", pady=4)
        ttk.Label(key_frame, text="DeepSeek API Key:").pack(side="left")
        self.key_var = tk.StringVar(value=DEEPSEEK_API_KEY)
        key_entry = ttk.Entry(key_frame, textvariable=self.key_var, width=50, show="*")
        key_entry.pack(side="left", padx=6, fill="x", expand=True)
        ttk.Button(key_frame, text="Show",
                   command=lambda: key_entry.configure(show="") if key_entry.cget("show") else key_entry.configure(show="*")
                   ).pack(side="left")

        input_frame = ttk.LabelFrame(main, text="Document Source", padding=8)
        input_frame.pack(fill="both", pady=4)

        btn_row = ttk.Frame(input_frame)
        btn_row.pack(fill="x", pady=(0, 4))
        ttk.Button(btn_row, text="Open File (PDF/DOCX/TXT)", command=self.pick_file).pack(side="left", padx=(0, 6))
        self.file_label = ttk.Label(btn_row, text="", foreground="gray")
        self.file_label.pack(side="left")

        self.text_widget = scrolledtext.ScrolledText(input_frame, height=8, wrap="word", font=("Consolas", 10))
        self.text_widget.pack(fill="both", expand=True)
        self.text_widget.insert("1.0", "Or paste your document text here...")
        self.text_widget.bind("<FocusIn>", lambda e: self.text_widget.delete("1.0", "end")
                              if self.text_widget.get("1.0", "end-1c") == "Or paste your document text here..." else None)

        opt_frame = ttk.Frame(main)
        opt_frame.pack(fill="x", pady=4)

        ttk.Label(opt_frame, text="Citation Style:").pack(side="left")
        self.style_var = tk.StringVar(value="apa7")
        style_menu = ttk.Combobox(opt_frame, textvariable=self.style_var, values=CITATION_STYLES, state="readonly", width=20)
        style_menu.pack(side="left", padx=6)

        self.export_btn = ttk.Button(opt_frame, text="Export PDF", command=self.export_results, state="disabled")
        self.export_btn.pack(side="right", padx=(4, 0))
        self.analyze_btn = ttk.Button(opt_frame, text="Analyze", command=self.start_analysis)
        self.analyze_btn.pack(side="right")

        self.progress_label = ttk.Label(opt_frame, text="", foreground="gray")
        self.progress_label.pack(side="right", padx=(0, 8))

        self.notebook = ttk.Notebook(main)
        self.notebook.pack(fill="both", expand=True, pady=(4, 0))

        self.citations_tab = ttk.Frame(self.notebook)
        self.refs_tab = ttk.Frame(self.notebook)
        self.warnings_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.citations_tab, text="Citations")
        self.notebook.add(self.refs_tab, text="References")
        self.notebook.add(self.warnings_tab, text="Style Warnings")

        self.cit_text = scrolledtext.ScrolledText(self.citations_tab, wrap="word", font=("Consolas", 10))
        self.cit_text.pack(fill="both", expand=True)
        self.cit_text.tag_configure("green", foreground="green")
        self.cit_text.tag_configure("red", foreground="red")
        self.cit_text.tag_configure("orange", foreground="#CC7000")
        self.ref_text = scrolledtext.ScrolledText(self.refs_tab, wrap="word", font=("Consolas", 10))
        self.ref_text.pack(fill="both", expand=True)
        self.ref_text.tag_configure("green", foreground="green")
        self.ref_text.tag_configure("red", foreground="red")
        self.warn_text = scrolledtext.ScrolledText(self.warnings_tab, wrap="word", font=("Consolas", 10))
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
            messagebox.showerror("API Key Required", "Enter your DeepSeek API key")
            return
        text = self.text_widget.get("1.0", "end-1c").strip()
        if not text or text == "Or paste your document text here...":
            messagebox.showerror("No Content", "Open a file or paste document text.")
            return
        style = self.style_var.get()
        self.analyze_btn.config(state="disabled", text="Analyzing...")
        self.export_btn.config(state="disabled")
        self.progress_label.config(text="Starting...")
        self.cit_text.delete("1.0", "end")
        self.ref_text.delete("1.0", "end")
        self.warn_text.delete("1.0", "end")

        def on_done(citations, refs, warnings, error=None):
            self.root.after(0, lambda: self.show_results(citations, refs, warnings, error))

        t = threading.Thread(target=analyze_document, args=(
            text, style, api_key, self.set_progress, on_done), daemon=True)
        t.start()

    def set_progress(self, msg):
        self.root.after(0, lambda: self.progress_label.config(text=msg))

    def show_results(self, citations, refs, warnings, error=None):
        self.analyze_btn.config(state="normal", text="Analyze")
        self.progress_label.config(text="")
        if error:
            messagebox.showerror("Analysis Failed", error)
            return

        self.citations, self.refs, self.warnings = citations, refs, warnings
        self.export_btn.config(state="normal")

        cit_txt = self.cit_text
        cit_txt.insert("end", f"Total citations: {len(citations)}\n", "bold")
        cit_txt.insert("end", "=" * 50 + "\n\n")
        for i, c in enumerate(citations):
            status = c.get("status", "pending")
            colour = "green" if status == "matched" else "red"
            cit_txt.insert("end", f"[{i}] {c.get('raw_text', '')}\n")
            cit_txt.insert("end", f"     Authors: {', '.join(c.get('extracted_authors', [])) or 'N/A'}\n")
            cit_txt.insert("end", f"     Year: {c.get('extracted_year', 'N/A')}  |  Type: {c.get('citation_type', 'N/A')}  |  Status: ", "bold")
            cit_txt.insert("end", f"{status}\n", colour)
            cit_txt.insert("end", f"     Confidence: {c.get('confidence', 'N/A')}\n\n")

        ref_txt = self.ref_text
        ref_txt.insert("end", f"Total references: {len(refs)}\n", "bold")
        ref_txt.insert("end", "=" * 50 + "\n\n")
        for i, r in enumerate(refs):
            status = r.get("status", "pending")
            colour = "green" if status == "cited" else "red"
            ref_txt.insert("end", f"[{i}] {r.get('raw_entry', '')}\n")
            ref_txt.insert("end", f"     Status: ", "bold")
            ref_txt.insert("end", f"{status}\n", colour)
            ref_txt.insert("end", "\n")

        warn_txt = self.warn_text
        warn_txt.insert("end", f"Total style warnings: {len(warnings)}\n", "bold")
        warn_txt.insert("end", "=" * 50 + "\n\n")
        for w in warnings:
            sev = w.get("severity", "info")
            colour = {"error": "red", "warning": "orange", "info": "green"}.get(sev, "")
            label = {"error": "❌", "warning": "⚠", "info": "ℹ"}.get(sev, "•")
            start = warn_txt.index("end-1c")
            warn_txt.insert("end", f"{label} [{sev.upper()}] {w.get('category', '')}: {w.get('message', '')}\n")
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


def show_unhandled_error(exc_type, exc_value, exc_traceback):
    import traceback
    err_msg = "".join(traceback.format_exception(exc_type, exc_value, exc_traceback))
    try:
        messagebox.showerror("Unexpected Error", f"{exc_value}\n\nCheck console for details.")
    except Exception:
        pass
    print(err_msg, flush=True)

if __name__ == "__main__":
    tk.Tk.report_callback_exception = show_unhandled_error
    app = CitePilotApp()
    app.run()
