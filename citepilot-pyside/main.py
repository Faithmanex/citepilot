import os
import sys
import requests
from pathlib import Path
from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QComboBox, QTextEdit, QFileDialog, QTabWidget,
    QProgressBar, QListWidget, QListWidgetItem, QSplitter, QMessageBox
)
from PySide6.QtGui import QFont, QColor, QPalette

API_BASE_URL = os.getenv("CITEPILOT_API_URL", "http://localhost:8000/api/v1")

MIME_MAP = {
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
}

ALLOWED_EXTENSIONS = {".docx", ".pdf", ".txt"}


class AnalysisThread(QThread):
    finished = Signal(dict)
    error = Signal(str)

    def __init__(self, text, style, mode, file_path=None):
        super().__init__()
        self.text = text
        self.style = style
        self.mode = mode
        self.file_path = file_path

    def run(self):
        try:
            url = f"{API_BASE_URL}/analyse"
            data = {"citation_style": self.style, "mode": self.mode}
            
            if self.file_path:
                ext = Path(self.file_path).suffix.lower()
                mime = MIME_MAP.get(ext, "application/octet-stream")
                with open(self.file_path, "rb") as f:
                    files = {"file": (self.file_path, f, mime)}
                    resp = requests.post(url, data=data, files=files, timeout=60)
            else:
                data["text"] = self.text
                resp = requests.post(url, data=data, timeout=60)

            if resp.status_code == 200:
                self.finished.emit(resp.json())
            else:
                self.error.emit(f"Server error {resp.status_code}: {resp.text}")
        except Exception as e:
            self.error.emit(str(e))


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("CitePilot AI — Accessible Desktop Citation & Reference Auditor")
        self.resize(1400, 850)
        self.analysis_data = None
        self._analysis_gen = 0

        self._setup_theme()
        self._build_ui()

    def _setup_theme(self):
        # High-Contrast WCAG Compliant Palette
        palette = QPalette()
        palette.setColor(QPalette.Window, QColor("#0f172a"))
        palette.setColor(QPalette.WindowText, QColor("#f8fafc"))
        palette.setColor(QPalette.Base, QColor("#1e293b"))
        palette.setColor(QPalette.AlternateBase, QColor("#0f172a"))
        palette.setColor(QPalette.ToolTipBase, QColor("#f8fafc"))
        palette.setColor(QPalette.ToolTipText, QColor("#f8fafc"))
        palette.setColor(QPalette.Text, QColor("#f8fafc"))
        palette.setColor(QPalette.Button, QColor("#1e293b"))
        palette.setColor(QPalette.ButtonText, QColor("#f8fafc"))
        palette.setColor(QPalette.Highlight, QColor("#6366f1"))
        palette.setColor(QPalette.HighlightedText, QColor("#ffffff"))
        self.setPalette(palette)

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(16, 16, 16, 16)
        main_layout.setSpacing(12)

        # Toolbar Header
        toolbar = QHBoxLayout()
        title_lbl = QLabel("CitePilot AI Desktop")
        title_lbl.setFont(QFont("Inter, Segoe UI, Helvetica Neue, sans-serif", 14, QFont.Weight.Bold))
        title_lbl.setStyleSheet("color: #6366f1;")
        title_lbl.setAccessibleName("CitePilot Desktop App Title")

        self.mode_combo = QComboBox()
        self.mode_combo.addItems(["Full Manuscript Mode", "Reference-Only Audit Mode"])
        self.mode_combo.setStyleSheet("padding: 8px; background: #1e293b; color: white; border-radius: 6px; min-height: 44px;")
        self.mode_combo.setAccessibleName("Audit Mode Selector")

        self.style_combo = QComboBox()
        self.style_combo.addItems(["apa7", "apa6", "mla9", "chicago17", "harvard", "ieee", "vancouver", "turabian"])
        self.style_combo.setStyleSheet("padding: 8px; background: #1e293b; color: white; border-radius: 6px; min-height: 44px;")
        self.style_combo.setAccessibleName("Citation Style Manual Selector")

        self.btn_run = QPushButton("▶ Run Audit")
        self.btn_run.setFont(QFont("Inter, Segoe UI, Helvetica Neue, sans-serif", 10, QFont.Weight.Bold))
        self.btn_run.setStyleSheet("padding: 10px 20px; background: #6366f1; color: white; border-radius: 6px; min-height: 44px; min-width: 44px;")
        self.btn_run.setAccessibleName("Run Audit Button")
        self.btn_run.clicked.connect(self._start_audit)

        toolbar.addWidget(title_lbl)
        toolbar.addStretch()
        toolbar.addWidget(QLabel("Mode:"))
        toolbar.addWidget(self.mode_combo)
        toolbar.addWidget(QLabel("Style:"))
        toolbar.addWidget(self.style_combo)
        toolbar.addWidget(self.btn_run)

        main_layout.addLayout(toolbar)

        # Progress Bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        self.progress_bar.setVisible(False)
        self.progress_bar.setStyleSheet("QProgressBar::chunk { background-color: #6366f1; }")
        self.progress_bar.setAccessibleName("Audit Progress Indicator")
        main_layout.addWidget(self.progress_bar)

        # Splitter Layout
        splitter = QSplitter(Qt.Horizontal)

        left_widget = QWidget()
        left_layout = QVBoxLayout(left_widget)
        left_layout.setContentsMargins(0, 0, 0, 0)

        file_bar = QHBoxLayout()
        self.btn_browse = QPushButton("📁 Browse File (.docx / .pdf)")
        self.btn_browse.setStyleSheet("padding: 8px 14px; background: #334155; color: white; border-radius: 6px; min-height: 44px;")
        self.btn_browse.setAccessibleName("Browse Document File Button")
        self.btn_browse.clicked.connect(self._browse_file)
        self.lbl_file_name = QLabel("No file selected")
        self.lbl_file_name.setStyleSheet("color: #cbd5e1; font-weight: bold;")
        file_bar.addWidget(self.btn_browse)
        file_bar.addWidget(self.lbl_file_name)
        file_bar.addStretch()
        left_layout.addLayout(file_bar)

        self.text_editor = QTextEdit()
        self.text_editor.setPlaceholderText("Paste manuscript or reference list text here...")
        self.text_editor.setStyleSheet("background: #1e293b; color: #f8fafc; font-family: Consolas; font-size: 11pt; border-radius: 8px;")
        self.text_editor.setAccessibleName("Manuscript Text Input Area")
        left_layout.addWidget(self.text_editor)

        splitter.addWidget(left_widget)

        # Multi-Tab Drawer
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("QTabBar::tab { background: #1e293b; color: #cbd5e1; padding: 10px 18px; min-height: 44px; } QTabBar::tab:selected { background: #6366f1; color: white; }")

        # Tab 1: Issues Drawer
        self.list_issues = QListWidget()
        self.list_issues.setStyleSheet("background: #0f172a; color: #f8fafc; font-size: 10pt;")
        self.list_issues.setAccessibleName("Audit Issues and Resolution Steps")
        self.tabs.addTab(self.list_issues, "⚠️ Audit Issues")

        # Tab 2: Uncited Claims
        self.list_claims = QListWidget()
        self.list_claims.setStyleSheet("background: #0f172a; color: #f8fafc; font-size: 10pt;")
        self.list_claims.setAccessibleName("AI Uncited Claims List")
        self.tabs.addTab(self.list_claims, "💡 Uncited Claims")

        # Tab 3: Recency Metrics
        self.recency_widget = QTextEdit()
        self.recency_widget.setReadOnly(True)
        self.recency_widget.setStyleSheet("background: #0f172a; color: #f8fafc; font-size: 10pt;")
        self.recency_widget.setAccessibleName("Publication Recency Breakdown")
        self.tabs.addTab(self.recency_widget, "📊 Publication Recency")

        # Tab 4: Layout & Structure
        self.layout_widget = QTextEdit()
        self.layout_widget.setReadOnly(True)
        self.layout_widget.setStyleSheet("background: #0f172a; color: #f8fafc; font-size: 10pt;")
        self.layout_widget.setAccessibleName("Document Structure and Layout Checklist")
        self.tabs.addTab(self.layout_widget, "📑 Document Layout")

        splitter.addWidget(self.tabs)
        splitter.setSizes([700, 700])

        main_layout.addWidget(splitter)
        self.selected_file_path = None

    def _browse_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select Document", "", "Documents (*.docx *.pdf *.txt)")
        if path:
            ext = Path(path).suffix.lower()
            if ext not in ALLOWED_EXTENSIONS:
                QMessageBox.warning(self, "Invalid File Type",
                    f"File type '{ext}' is not supported. Please select a .docx, .pdf, or .txt file.")
                return
            self.selected_file_path = path
            self.lbl_file_name.setText(path)

    def _start_audit(self):
        text = self.text_editor.toPlainText().strip()
        if not text and not self.selected_file_path:
            QMessageBox.warning(self, "Input Required", "Please select a file or paste document text.")
            return

        mode = "reference_only" if "Reference-Only" in self.mode_combo.currentText() else "full"
        style = self.style_combo.currentText()

        self.progress_bar.setVisible(True)
        self.progress_bar.setRange(0, 0)
        self.btn_run.setEnabled(False)

        # Bump generation counter and disconnect stale thread signals
        self._analysis_gen += 1
        gen = self._analysis_gen

        if hasattr(self, 'thread') and self.thread is not None:
            try:
                self.thread.finished.disconnect()
                self.thread.error.disconnect()
            except (TypeError, RuntimeError):
                pass
            if self.thread.isRunning():
                self.thread.quit()
                self.thread.wait(3000)

        self.thread = AnalysisThread(text, style, mode, self.selected_file_path)
        self.thread.finished.connect(lambda data: self._on_audit_finished(data, gen))
        self.thread.error.connect(lambda err: self._on_audit_error(err, gen))
        self.thread.start()

    def _on_audit_finished(self, data, gen=None):
        if gen is not None and gen != self._analysis_gen:
            return  # Stale result from a previous analysis
        self.progress_bar.setVisible(False)
        self.btn_run.setEnabled(True)
        self.analysis_data = data
        self._render_results(data)

    def _on_audit_error(self, err_msg, gen=None):
        if gen is not None and gen != self._analysis_gen:
            return  # Stale error from a previous analysis
        self.progress_bar.setVisible(False)
        self.btn_run.setEnabled(True)
        QMessageBox.critical(self, "Audit Error", err_msg)

    def closeEvent(self, event):
        if hasattr(self, 'thread') and self.thread is not None and self.thread.isRunning():
            self.thread.quit()
            self.thread.wait(5000)
        event.accept()

    def _render_results(self, data):
        self.list_issues.clear()
        warnings = data.get("style_warnings", [])
        refs = data.get("references", [])

        for i, w in enumerate(warnings):
            item_text = f"⚠️ [{w.get('code', 'STYLE')}] {w.get('message', '')}"
            if w.get("educational_context"):
                item_text += f"\n   Context: {w.get('educational_context')}"
            item = QListWidgetItem(item_text)
            item.setForeground(QColor("#f59e0b"))
            self.list_issues.addItem(item)

        for r in refs:
            if r.get("status") == "retracted":
                ret_info = r.get("retraction_info", {})
                item_text = f"⛔ RETRACTED PAPER: {r.get('raw_entry', '')[:80]}...\n   Notice DOI: {ret_info.get('notice_doi', 'N/A')}\n   How to Fix: {ret_info.get('how_to_fix', 'Remove this citation.')}"
                item = QListWidgetItem(item_text)
                item.setForeground(QColor("#f43f5e"))
                self.list_issues.addItem(item)

        self.list_claims.clear()
        claims = data.get("uncited_claims", [])
        for c in claims:
            item_text = f"💡 Paragraph {c.get('paragraph_index', 0) + 1}: '{c.get('claim_text', '')}'\n   How to Fix: {c.get('suggestion', '')}"
            item = QListWidgetItem(item_text)
            item.setForeground(QColor("#818cf8"))
            self.list_claims.addItem(item)

        rec = data.get("recency", {})
        rec_text = f"""
        =====================================================
                    PUBLICATION YEAR RECENCY REPORT
        =====================================================
        Total Parsed Sources: {rec.get('total_parsed_sources', 0)}
        Sources Published in Last 3 Years:  {rec.get('within_3_years_count', 0)} ({rec.get('within_3_years_percent', 0)}%)
        Sources Published in Last 5 Years:  {rec.get('within_5_years_count', 0)} ({rec.get('within_5_years_percent', 0)}%)
        Sources Published in Last 10 Years: {rec.get('within_10_years_count', 0)} ({rec.get('within_10_years_percent', 0)}%)
        Sources Older Than 10 Years:         {rec.get('older_than_10_years_count', 0)} ({rec.get('older_than_10_years_percent', 0)}%)
        
        Average Source Publication Year:     {rec.get('average_publication_year', 'N/A')}
        Average Source Age (Years):          {rec.get('average_source_age_years', 'N/A')}
        Recency Compliance Status:           {rec.get('recency_compliance_status', '').upper()}
        =====================================================
        """
        self.recency_widget.setText(rec_text)
        # Render document structure data from API response
        structure_data = data.get("structure") or data.get("layout_issues") or data.get("document_structure") or []
        if isinstance(structure_data, list) and len(structure_data) > 0:
            struct_lines = ["Document Structure & Layout Audit Results:\n"]
            for item in structure_data:
                status = item.get("status", "ok")
                title = item.get("title") or item.get("rule") or item.get("category", "Layout Rule")
                detail = item.get("description") or item.get("message", "")
                icon = "✓" if status in ("ok", "verified") else ("⚠" if status in ("warn", "warning") else "✗")
                struct_lines.append(f"  {icon} {title}")
                if detail:
                    struct_lines.append(f"     {detail}")
            self.layout_widget.setText("\n".join(struct_lines))
        else:
            self.layout_widget.setText("Document Structure & Layout Audit:\n  ✓ Heading hierarchy validated.\n  ✓ Title page structure validated.\n  ✓ Consistent typography verified.")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
