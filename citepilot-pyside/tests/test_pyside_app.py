import sys
import pytest
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt

# Ensure single QApplication instance for Qt GUI tests
@pytest.fixture(scope="session")
def qapp():
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)
    yield app


def test_mainwindow_instantiation(qapp):
    from main import MainWindow
    window = MainWindow()
    assert window.windowTitle().startswith("CitePilot AI Desktop")
    assert window.mode_combo.count() == 2
    assert window.style_combo.count() == 9
    assert window.tabs.count() == 5


def test_render_results(qapp):
    from main import MainWindow
    window = MainWindow()

    mock_data = {
        "citations": [
            {
                "raw_text": "(Smith, 2020)",
                "paragraph_index": 0,
                "status": "no_match"
            }
        ],
        "references": [
            {
                "raw_entry": "Doe, J. (2019). Fake Paper Title.",
                "status": "retracted",
                "retraction_info": {
                    "notice_doi": "10.1016/j.retraction.2021",
                    "how_to_fix": "Remove retracted paper."
                },
                "crossref_validation": {
                    "discrepancies": [
                        {
                            "field": "year",
                            "message": "Year discrepancy detected.",
                            "how_to_fix": "Change 2019 to 2020."
                        }
                    ]
                }
            }
        ],
        "style_warnings": [
            {
                "code": "MISSING_DOI",
                "message": "Journal article reference is missing DOI.",
                "suggestion": "Add DOI link."
            }
        ],
        "uncited_claims": [
            {
                "paragraph_index": 1,
                "claim_text": "90% of students cite incorrectly.",
                "suggestion": "Add source citation."
            }
        ],
        "recency": {
            "total_parsed_sources": 1,
            "within_3_years_count": 0,
            "within_5_years_percent": 0.0,
            "within_10_years_percent": 100.0,
            "older_than_10_years_percent": 0.0,
            "average_publication_year": 2019,
            "average_source_age_years": 5.0,
            "recency_compliance_status": "warning"
        }
    }

    window._render_results(mock_data)

    assert window.list_issues.count() == 4
    assert window.list_claims.count() == 1
    assert "PUBLICATION YEAR RECENCY REPORT" in window.recency_widget.toPlainText()
    assert "Heading hierarchy validated" in window.layout_widget.toPlainText()
