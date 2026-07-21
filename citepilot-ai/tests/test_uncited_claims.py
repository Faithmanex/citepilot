import asyncio
from unittest.mock import AsyncMock, patch
import pytest

from citepilot_ai.services.uncited_claims_detector import detect_uncited_claims


def test_detect_uncited_claims_empty():
    async def _test():
        res = await detect_uncited_claims("", [])
        assert res == []

    asyncio.run(_test())


def test_detect_uncited_claims_processes_all_paragraphs():
    async def _test():
        paras_meta = [{"paragraph_index": i, "text": f"Paragraph content number {i}."} for i in range(75)]
        body_text = "\n\n".join([p["text"] for p in paras_meta])

        mock_llm_json = '{"uncited_claims": [{"paragraph_index": 65, "claim_text": "75% of subjects exhibited symptoms.", "reason": "Uncited statistic."}]}'

        with patch("citepilot_ai.services.uncited_claims_detector.async_call_gemini", new_callable=AsyncMock) as mock_ai:
            mock_ai.return_value = mock_llm_json
            claims = await detect_uncited_claims(body_text, paras_meta)
            assert len(claims) == 1
            assert claims[0]["paragraph_index"] == 65
            assert claims[0]["code"] == "UNCITED_FACTUAL_CLAIM"

    asyncio.run(_test())
