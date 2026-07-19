import logging
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont, QIcon
from PySide6.QtWidgets import (
    QApplication,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QProgressBar,
    QStatusBar,
    QTabWidget,
    QVBoxLayout,
    QWidget,
)

from .document_inspector import DocumentInspectorWidget
from .reference_only_tab import ReferenceOnlyTab

logger = logging.getLogger(__name__)


class MainWindow(QMainWindow):
    def __init__(self, backend_url: str = "http://localhost:8000"):
        super().__init__()
        self.backend_url = backend_url

        self.setWindowTitle("CitePilot Next-Gen — AI Citation & Reference Auditor")
        self.resize(1150, 780)

        self._init_ui()

    def _init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)

        # Header Title Banner
        header = QHBoxLayout()
        title_label = QLabel("CitePilot Academic Suite")
        title_label.setFont(QFont("Segoe UI", 16, QFont.Bold))
        title_label.setStyleSheet("color: #38bdf8; margin-bottom: 5px;")
        header.addWidget(title_label)

        sub_label = QLabel("100% AI Dynamic Citation & Reference Integrity Auditor")
        sub_label.setFont(QFont("Segoe UI", 10, QFont.Italic))
        sub_label.setStyleSheet("color: #94a3b8; margin-bottom: 5px;")
        header.addWidget(sub_label)

        header.addStretch()
        main_layout.addLayout(header)

        # Main Tab Container
        self.tabs = QTabWidget()

        self.tab_full_doc = DocumentInspectorWidget(backend_url=self.backend_url)
        self.tab_ref_only = ReferenceOnlyTab(backend_url=self.backend_url)

        self.tabs.addTab(self.tab_full_doc, "Full Manuscript Inspector")
        self.tabs.addTab(self.tab_ref_only, "Reference-List-Only Audit")

        main_layout.addWidget(self.tabs)

        # Status Bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Ready. Connected to CitePilot-AI Backend.")
