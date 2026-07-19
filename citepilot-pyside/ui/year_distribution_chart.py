import logging
from PySide6.QtCore import Qt, QRectF
from PySide6.QtGui import QColor, QFont, QPainter, QBrush, QPen
from PySide6.QtWidgets import QFrame, QLabel, QVBoxLayout, QWidget, QHBoxLayout

logger = logging.getLogger(__name__)


class YearDistributionWidget(QFrame):
    """Custom Qt Widget rendering Publication Year Distribution graphs & stats."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFrameShape(QFrame.StyledPanel)
        self.setStyleSheet("""
            QFrame {
                background-color: #1e293b;
                border: 1px solid #334155;
                border-radius: 8px;
            }
        """)

        self.last_5_pct = 0.0
        self.last_10_pct = 0.0
        self.decades = {}
        self.total_refs = 0

        self._init_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)

        title = QLabel("Publication Year Recency Distribution")
        title.setFont(QFont("Segoe UI", 11, QFont.Bold))
        title.setStyleSheet("color: #38bdf8; border: none; background: transparent;")
        layout.addWidget(title)

        stats_layout = QHBoxLayout()

        self.lbl_5yr = QLabel("Last 5 Years: 0.0%")
        self.lbl_5yr.setFont(QFont("Segoe UI", 10, QFont.Bold))
        self.lbl_5yr.setStyleSheet("color: #4ade80; border: none; background: transparent;")

        self.lbl_10yr = QLabel("Last 10 Years: 0.0%")
        self.lbl_10yr.setFont(QFont("Segoe UI", 10, QFont.Bold))
        self.lbl_10yr.setStyleSheet("color: #facc15; border: none; background: transparent;")

        self.lbl_total = QLabel("Total Dated Sources: 0")
        self.lbl_total.setStyleSheet("color: #94a3b8; border: none; background: transparent;")

        stats_layout.addWidget(self.lbl_5yr)
        stats_layout.addWidget(self.lbl_10yr)
        stats_layout.addWidget(self.lbl_total)
        stats_layout.addStretch()

        layout.addLayout(stats_layout)

        self.canvas = GraphCanvas(self)
        layout.addWidget(self.canvas)

    def set_data(self, distribution: dict):
        if not distribution:
            return

        self.total_refs = distribution.get("total_references_with_year", 0)
        self.last_5_pct = distribution.get("last_5_years_pct", 0.0)
        self.last_10_pct = distribution.get("last_10_years_pct", 0.0)
        self.decades = distribution.get("distribution_by_decade", {})

        self.lbl_5yr.setText(f"Last 5 Years: {self.last_5_pct}%")
        self.lbl_10yr.setText(f"Last 10 Years: {self.last_10_pct}%")
        self.lbl_total.setText(f"Total Dated Sources: {self.total_refs}")

        self.canvas.update_data(self.decades)


class GraphCanvas(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumHeight(120)
        self.decades = {}

    def update_data(self, decades: dict):
        self.decades = decades
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        w = self.width()
        h = self.height()

        painter.fillRect(0, 0, w, h, QColor("#1e293b"))

        if not self.decades:
            painter.setPen(QColor("#64748b"))
            painter.setFont(QFont("Segoe UI", 9, QFont.Italic))
            painter.drawText(QRectF(0, 0, w, h), Qt.AlignCenter, "No date distribution data available")
            return

        sorted_keys = sorted(self.decades.keys())
        max_val = max(self.decades.values()) if self.decades else 1

        bar_count = len(sorted_keys)
        margin = 30
        bar_width = max(10, int((w - (margin * 2)) / bar_count) - 10)

        for idx, key in enumerate(sorted_keys):
            val = self.decades[key]
            bar_h = int((val / max_val) * (h - 40))
            x = margin + idx * (bar_width + 10)
            y = h - 25 - bar_h

            painter.setBrush(QBrush(QColor("#3b82f6")))
            painter.setPen(Qt.NoPen)
            painter.drawRoundedRect(x, y, bar_width, bar_h, 4, 4)

            painter.setPen(QColor("#f8fafc"))
            painter.setFont(QFont("Segoe UI", 8))
            painter.drawText(x, y - 4, bar_width, 15, Qt.AlignCenter, str(val))

            painter.setPen(QColor("#94a3b8"))
            painter.setFont(QFont("Segoe UI", 8))
            painter.drawText(x, h - 20, bar_width, 15, Qt.AlignCenter, key)
