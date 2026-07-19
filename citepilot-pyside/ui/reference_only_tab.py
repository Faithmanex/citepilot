import json
import logging
import httpx
from PySide6.QtCore import Qt, QThread, Signal
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


class ReferenceWorker(QThread):
    finished = Signal(dict)
    error = Signal(str)

    def __init__(self, text: str, style: str, backend_url: str):
        super().__init__()
        self.text = text
        self.style = style
        self.backend_url = backend_url

    def run(self):
        try:
            url = f"{self.backend_url}/api/v1/analyze-references-only"
            payload = {
                "reference_text": self.text,
                "citation_style": self.style,
                "include_crossref": True
            }
            resp = httpx.post(url, json=payload, timeout=60.0)
            if resp.status_code == 200:
                self.finished.emit(resp.json())
            else:
                self.error.emit(f"Backend error HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            self.error.emit(f"Network request failed: {e}")


class ReferenceOnlyTab(QWidget):
    def __init__(self, backend_url: str = "http://localhost:8000", parent=None):
        super().__init__(parent)
        self.backend_url = backend_url
        self._init_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)

        top_bar = QHBoxLayout()
        lbl = QLabel("Reference-List-Only Diagnostic Mode")
        lbl.setStyleSheet("font-size: 14px; font-weight: bold; color: #38bdf8;")
        top_bar.addWidget(lbl)

        top_bar.addStretch()

        top_bar.addWidget(QLabel("Style:"))
        self.combo_style = QComboBox()
        self.combo_style.addItems(["apa7", "apa6", "mla9", "chicago", "harvard", "vancouver", "ieee", "oscola", "turabian"])
        top_bar.addWidget(self.combo_style)

        self.btn_load = QPushButton("Load File")
        self.btn_load.setObjectName("secondaryBtn")
        self.btn_load.clicked.connect(self._load_file)
        top_bar.addWidget(self.btn_load)

        self.btn_analyze = QPushButton("Audit Bibliography")
        self.btn_analyze.clicked.connect(self._analyze)
        top_bar.addWidget(self.btn_analyze)

        layout.addLayout(top_bar)

        splitter = QSplitter(Qt.Horizontal)

        left_widget = QWidget()
        left_layout = QVBoxLayout(left_widget)
        left_layout.addWidget(QLabel("Paste or Upload Reference List Entries:"))
        self.txt_input = QTextEdit()
        self.txt_input.setPlaceholderText("Paste reference entries here...\n\nExample:\nSmith, J. A. (2020). Digital knowledge workflows. Journal of Systems, 12(2), 45-60.")
        left_layout.addWidget(self.txt_input)
        splitter.addWidget(left_widget)

        right_widget = QWidget()
        right_layout = QVBoxLayout(right_widget)

        self.year_chart = YearDistributionWidget()
        right_layout.addWidget(self.year_chart)

        right_layout.addWidget(QLabel("Parsed References & Metadata Diagnostics:"))
        self.list_refs = QListWidget()
        right_layout.addWidget(self.list_refs)

        splitter.addWidget(right_widget)
        splitter.setSizes([450, 550])

        layout.addWidget(splitter)

    def _load_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Open Reference List File", "", "Text Files (*.txt);;Word Documents (*.docx);;All Files (*.*)")
        if path:
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    self.txt_input.setPlainText(f.read())
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to read file: {e}")

    def _analyze(self):
        text = self.txt_input.toPlainText().strip()
        if not text:
            QMessageBox.warning(self, "Warning", "Please paste or load reference text first.")
            return

        self.btn_analyze.setEnabled(False)
        self.btn_analyze.setText("Auditing...")
        self.list_refs.clear()

        style = self.combo_style.currentText()
        self.worker = ReferenceWorker(text, style, self.backend_url)
        self.worker.finished.connect(self._on_success)
        self.worker.error.connect(self._on_error)
        self.worker.start()

    def _on_success(self, data: dict):
        self.btn_analyze.setEnabled(True)
        self.btn_analyze.setText("Audit Bibliography")

        refs = data.get("references", [])
        year_dist = data.get("year_distribution", {})
        doi_vals = data.get("doi_validations", [])

        self.year_chart.set_data(year_dist)

        for r in refs:
            entry = r.get("raw_entry", "")
            year = r.get("parsed_year", "N/A")
            doi = r.get("parsed_doi") or "No DOI"
            rtype = r.get("reference_type", "unknown")

            item_text = f"[{rtype.upper()}] (Year: {year} | DOI: {doi})\n{entry}"
            item = QListWidgetItem(item_text)
            self.list_refs.addItem(item)

        QMessageBox.information(self, "Audit Complete", f"Parsed {len(refs)} reference entries successfully.")

    def _on_error(self, err_msg: str):
        self.btn_analyze.setEnabled(True)
        self.btn_analyze.setText("Audit Bibliography")
        QMessageBox.critical(self, "Error", err_msg)
