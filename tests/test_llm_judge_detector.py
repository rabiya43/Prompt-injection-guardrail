import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from src.detectors.llm_judge_detector import LLMJudgeDetector
from src.schemas import DetectionVerdict

@pytest.fixture
def mock_openai():
    with patch("src.detectors.llm_judge_detector.AsyncOpenAI") as mock:
        yield mock

def create_mock_response(text):
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = text
    mock_response.choices = [mock_choice]
    return mock_response

@pytest.mark.asyncio
async def test_llm_judge_successful_parse(mock_openai):
    mock_client = mock_openai.return_value
    mock_client.chat.completions.create = AsyncMock(return_value=create_mock_response('{"is_injection": true, "confidence": 0.9, "reasoning": "Clear roleplay."}'))
    
    detector = LLMJudgeDetector(client=mock_client)
    result = await detector.detect("Fake content")
    
    assert result.is_injection is True
    assert result.confidence == 0.9
    assert result.reasoning == "Clear roleplay."
    assert result.triggered_by == "llm_judge"

@pytest.mark.asyncio
async def test_llm_judge_strips_markdown(mock_openai):
    mock_client = mock_openai.return_value
    mock_client.chat.completions.create = AsyncMock(return_value=create_mock_response('```json\n{"is_injection": false, "confidence": 0.8, "reasoning": "Normal text."}\n```'))
    
    detector = LLMJudgeDetector(client=mock_client)
    result = await detector.detect("Fake content")
    
    assert result.is_injection is False
    assert result.confidence == 0.8

@pytest.mark.asyncio
async def test_llm_judge_retry_on_malformed_json(mock_openai):
    mock_client = mock_openai.return_value
    mock_response_1 = create_mock_response('This is not JSON')
    mock_response_2 = create_mock_response('{"is_injection": true, "confidence": 0.5, "reasoning": "Fixed JSON."}')
    
    mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response_1, mock_response_2])
    
    detector = LLMJudgeDetector(client=mock_client)
    result = await detector.detect("Fake content")
    
    assert mock_client.chat.completions.create.call_count == 2
    assert result.is_injection is True
    assert result.confidence == 0.5
    assert result.reasoning == "Fixed JSON."

@pytest.mark.asyncio
async def test_llm_judge_fallback_on_repeated_failure(mock_openai):
    mock_client = mock_openai.return_value
    mock_response = create_mock_response('Still not JSON')
    
    mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response, mock_response])
    
    detector = LLMJudgeDetector(client=mock_client)
    result = await detector.detect("Fake content")
    
    assert mock_client.chat.completions.create.call_count == 2
    assert result.is_injection is False
    assert result.confidence == 0.0
    assert result.reasoning == "parse failure"
