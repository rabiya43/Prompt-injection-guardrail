import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from src.detectors.pipeline import evaluate_content
from src.schemas import DetectionVerdict

@pytest.fixture
def mock_heuristic():
    with patch("src.detectors.pipeline.heuristic_detector.detect") as mock:
        yield mock

@pytest.fixture
def mock_judge():
    with patch("src.detectors.pipeline.llm_judge_detector.detect", new_callable=AsyncMock) as mock:
        yield mock

@pytest.mark.asyncio
async def test_pipeline_skips_judge_on_high_heuristic_confidence(mock_heuristic, mock_judge):
    with patch("src.detectors.pipeline.JUDGE_MODE", "on_uncertain"):
        with patch("src.detectors.pipeline.HEURISTIC_SKIP_THRESHOLD", 0.85):
            mock_heuristic.return_value = DetectionVerdict(
                is_injection=True, confidence=0.9, reasoning="H", triggered_by="heuristic"
            )
            
            result = await evaluate_content("Fake")
            
            assert result.triggered_by == "heuristic"
            assert result.is_injection is True
            mock_judge.assert_not_called()

@pytest.mark.asyncio
async def test_pipeline_skips_judge_on_low_heuristic_confidence(mock_heuristic, mock_judge):
    with patch("src.detectors.pipeline.JUDGE_MODE", "on_uncertain"):
        with patch("src.detectors.pipeline.HEURISTIC_UNCERTAIN_LOW", 0.2):
            mock_heuristic.return_value = DetectionVerdict(
                is_injection=False, confidence=0.0, reasoning="H", triggered_by="heuristic"
            )
            
            result = await evaluate_content("Fake")
            
            assert result.triggered_by == "heuristic"
            assert result.is_injection is False
            mock_judge.assert_not_called()

@pytest.mark.asyncio
async def test_pipeline_calls_judge_on_uncertainty(mock_heuristic, mock_judge):
    with patch("src.detectors.pipeline.JUDGE_MODE", "on_uncertain"):
        with patch("src.detectors.pipeline.HEURISTIC_UNCERTAIN_LOW", 0.2):
            with patch("src.detectors.pipeline.HEURISTIC_SKIP_THRESHOLD", 0.85):
                mock_heuristic.return_value = DetectionVerdict(
                    is_injection=True, confidence=0.6, reasoning="H", triggered_by="heuristic"
                )
                mock_judge.return_value = DetectionVerdict(
                    is_injection=True, confidence=0.8, reasoning="J", triggered_by="llm_judge"
                )
                
                result = await evaluate_content("Fake")
                
                assert result.triggered_by == "both"
                assert result.is_injection is True
                assert result.confidence == 0.8
                assert "Heuristic: H | Judge: J" in result.reasoning
                mock_judge.assert_called_once()

@pytest.mark.asyncio
async def test_pipeline_calls_judge_always_when_mode_is_always(mock_heuristic, mock_judge):
    with patch("src.detectors.pipeline.JUDGE_MODE", "always"):
        mock_heuristic.return_value = DetectionVerdict(
            is_injection=True, confidence=0.99, reasoning="H", triggered_by="heuristic"
        )
        mock_judge.return_value = DetectionVerdict(
            is_injection=True, confidence=0.9, reasoning="J", triggered_by="llm_judge"
        )
        
        result = await evaluate_content("Fake")
        
        assert result.triggered_by == "both"
        mock_judge.assert_called_once()
