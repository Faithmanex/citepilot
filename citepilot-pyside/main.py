import os
import sys
from pathlib import Path

from PySide6.QtWidgets import QApplication
from ui.main_window import MainWindow


def main():
    app = QApplication(sys.argv)

    # Load QSS Stylesheet
    qss_path = Path(__file__).parent / "ui" / "styles.qss"
    if qss_path.exists():
        with open(qss_path, "r", encoding="utf-8") as f:
            app.setStyleSheet(f.read())

    backend_url = os.environ.get("CITEPILOT_BACKEND_URL", "http://localhost:8000")
    window = MainWindow(backend_url=backend_url)
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
