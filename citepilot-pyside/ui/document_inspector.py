import json
import logging
import httpx
from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtGui import QColor, QFont, QTextCharFormat, QTextCursor
from PySide6.QtWidgets import (
    QComboBox,
    QFileDialog,
    QHBoxLayout,
    QLabel,
    QListWidget,
    QListWidgetItem,
    QMessageBox,
    QPushButton,
    QSplitter,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from .year_distribution_chart import YearDistributionWidget

logger = logging.getLogger(__name__)


class FullDocumentWorker(QThread):
    finished = Signal(dict)
    error = Signal(str)

    def __init__(self, text: str, style: str, backend_url: str):
        super().__init__()
        self.text = text
        self.style = style
        self.backend_url = backend_url

    def run(self):
        try:
            url = f"{self.backend_url}/api/v1/analyze-document"
            payload = {
                "text": self.text,
                "citation_style": self.style,
                "include_crossref": True,
                "include_uncited_claims": True
            }
            resp = httpx.post(url, json=payload, timeout=90.0)
            if resp.status_code == 200:
                self.finished.emit(resp.json())
            else:
                self.error.emit(f"Backend error HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            self.error.emit(f"Network error: {e}")


class DocumentInspectorWidget(QWidget):
    def __init__(self, backend_url: str = "http://localhost:8000", parent=None):
        super().__init__(parent)
        self.backend_url = backend_url
        self.current_analysis = {}
        self.filename = "Manuscript.docx"

        self._init_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)

        top_bar = QHBoxLayout()
        lbl = QLabel("Full Manuscript Interactive Document Inspector")
        lbl.setStyleSheet("font-size: 14px; font-weight: bold; color: #38bdf8;")
        top_bar.addWidget(lbl)

        top_bar.addStretch()

        top_bar.addWidget(QLabel("Style:"))
        self.combo_style = QComboBox()
        self.combo_style.addItems(["apa7", "apa6", "mla9", "chicago", "harvard", "vancouver", "ieee", "oscola", "turabian"])
        top_bar.addWidget(self.combo_style)

        self.btn_load = QPushButton("Open File")
        self.btn_load.setObjectName("secondaryBtn")
        self.btn_load.clicked.connect(self._open_file)
        top_bar.addWidget(self.btn_load)

        self.btn_analyze = QPushButton("Analyze Citation Integrity")
        self.btn_analyze.clicked.connect(self._start_analysis)
        top_bar.addWidget(self.btn_analyze)

        self.btn_pdf = QPushButton("Export Diagnostic PDF")
        self.btn_pdf.setObjectName("secondaryBtn")
        self.btn_pdf.setEnabled(False)
        self.btn_pdf.clicked.connect(self._export_pdf)
        top_bar.addWidget(self.btn_pdf)

        layout.addLayout(top_bar)

        splitter = QSplitter(Qt.Horizontal)

        left_widget = QWidget()
        left_layout = QVBoxLayout(left_widget)
        left_layout.addWidget(QLabel("Manuscript Text Viewer (Highlighted Citation Status):"))
        self.txt_doc = QTextEdit()
        left_layout.addWidget(self.txt_doc)
        splitter.addWidget(left_widget)

        right_widget = QWidget()
        right_layout = QVBoxLayout(right_widget)

        self.year_chart = YearDistributionWidget()
        right_layout.addWidget(self.year_chart)

        right_layout.addWidget(QLabel("Diagnostic Findings & Audit Warnings:"))
        self.list_issues = QListWidget()
        right_layout.addWidget(self.list_issues)

        splitter.addWidget(right_widget)
        splitter.setSizes([500, 500])

        layout.addWidget(splitter)

    def _open_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Open Document File", "", "Word Documents (*.docx);;PDF Files (*.pdf);;Text Files (*.txt);;All Files (*.*)")
        if path:
            self.filename = path
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    self.txt_doc.setPlainText(f.read())
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to open file: {e}")

    def _start_analysis(self):
        text = self.txt_doc.toPlainText().strip()
        if not text:
            QMessageBox.warning(self, "Warning", "Please open or paste document text to analyze.")
            return

        self.btn_analyze.setEnabled(False)
        self.btn_analyze.setText("Analyzing AI Pipeline...")

        style = self.combo_style.currentText()
        self.worker = FullDocumentWorker(text, style, self.backend_url)
        self.worker.finished.connect(self._on_analysis_success)
        self.worker.error.connect(self._on_analysis_error)
        self.worker.start()

    def _on_analysis_success(self, data: dict):
        self.btn_analyze.setEnabled(True)
        self.btn_analyze.setText("Analyze Citation Integrity")
        self.btn_pdf.setEnabled(True)
        self.current_analysis = data

        citations = data.get("citations", [])
        issues = data.get("audit_issues", [])
        year_dist = data.get("year_distribution", {})

        self.year_chart.set_data(year_dist)
        self._highlight_citations(citations)
        self._populate_issues(issues)

        QMessageBox.information(self, "Audit Complete", f"Analysis finished in {data.get('elapsed_seconds')}s.\nCitations: {len(citations)}\nIssues Identified: {len(issues)}")

    def _on_analysis_error(self, err_msg: str):
        self.btn_analyze.setEnabled(True)
        self.btn_analyze.setText("Analyze Citation Integrity")
        QMessageBox.critical(self, "Error", err_msg)

    def _highlight_citations(self, citations: list):
        doc = self.txt_doc.document()

        for c in citations:
            raw_text = c.get("raw_text", "")
            if not raw_text:
                continue

            status = c.get("status", "no_match")
            fmt = QTextCharFormat()

            if status == "matched":
                fmt.setBackground(QColor(22, 101, 52, 120))  # Green tint
                fmt.setToolTip("Matched to Reference List")
            else:
                fmt.setBackground(QColor(185, 28, 28, 120))  # Red tint
                fmt.setToolTip("Unmatched / Missing Reference")

            cursor = QTextCursor(doc)
            while not cursor.isNull() and not cursor.atEnd():
                cursor = doc.find(raw_text, cursor)
                if not cursor.isNull():
                    cursor.mergeCharFormat(fmt)

    def _populate_issues(self, issues: list):
        self.list_issues.clear()
        for issue in issues:
            cat = issue.get("category", "style")
            label = issue.get("label", "Issue")
            msg = issue.get("message", "")
            severity = issue.get("severity", "warning").upper()

            item_text = f"[{severity}] ({cat}) {label}\n{msg}"
            item = QListWidgetItem(item_text)

            if severity == "ERROR":
                item.setForeground(QColor("#f87171"))
            elif severity == "WARNING":
                item.setForeground(QColor("#fbbf24"))
            else:
                item.setForeground(QColor("#38bdf8"))

            self.list_issues.addItem(item)

    def _export_pdf(self):
        if not self.current_analysis:
            return

        path, _ = QFileDialog.getSaveFileName(self, "Save Diagnostic PDF Report", f"{self.filename}_audit_report.pdf", "PDF Files (*.pdf)")
        if path:
            try:
                url = f"{self.backend_url}/api/v1/export-pdf-report"
                payload = {
                    "filename": self.filename,
                    "citation_style": self.combo_style.currentText(),
                    "citations": self.current_analysis.get("citations", []),
                    "references": self.current_analysis.get("references", []),
                    "audit_issues": self.current_analysis.get("audit_issues", []),
                    "year_distribution": self.current_analysis.get("year_distribution", {})
                }
                resp = httpx.post(url, json=payload, timeout=30.0)
                if resp.status_code == 200:
                    with open(path, "wb") as f:
                        f.write(resp.content)
                    QMessageBox.information(self, "Success", f"Diagnostic PDF report exported to:\n{path}")
                else:
                    QMessageBox.critical(self, "Error", f"PDF Export failed: HTTP {resp.status_code}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to export PDF: {e}")
