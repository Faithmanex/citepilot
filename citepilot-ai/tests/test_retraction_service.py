import asyncio
from unittest.mock import AsyncMock, patch
import pytest

from citepilot_ai.services.retraction_service import (
    check_retraction_status,
    _analyze_crossref_retraction,
)


def test_check_retraction_status_with_pre_fetched_work():
    async def _test():
        retracted_work = {
            "relation": {
                "is-retracted-by": [{"id": "10.1000/notice.001"}]
            },
            "title": ["Experimental oncology findings"]
        }
        res = await check_retraction_status("10.1000/123", crossref_work=retracted_work)
        assert res["is_retracted"] is True
        assert res["status"] == "retracted"
        assert res["notice_doi"] == "10.1000/notice.001"

    asyncio.run(_test())


def test_check_retraction_status_normal_paper():
    async def _test():
        normal_work = {
            "title": ["Analysis of Retracted Papers in Literature"],
            "relation": {},
            "update-to": []
        }
        res = await check_retraction_status("10.1000/456", crossref_work=normal_work)
        assert res["is_retracted"] is False
        assert res["status"] == "normal"

    asyncio.run(_test())


def test_analyze_crossref_expression_of_concern():
    work_concern = {
        "update-to": [{"label": "Expression of Concern", "DOI": "10.1000/concern.01"}]
    }
    res = _analyze_crossref_retraction(work_concern)
    assert res["is_retracted"] is True
    assert res["status"] == "expression_of_concern"
    assert res["severity"] == "orange"
