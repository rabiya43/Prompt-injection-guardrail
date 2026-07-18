import time
import asyncio
import logging
from fastapi import APIRouter, HTTPException
from api.models import CheckRequest, CheckResponse, BatchCheckRequest, BatchCheckResponse
from src.detectors.pipeline import evaluate_content

router = APIRouter(prefix="/check", tags=["check"])
logger = logging.getLogger(__name__)

async def process_content(content: str) -> CheckResponse:
    start_time = time.perf_counter()
    error_msg = None
    try:
        verdict = await evaluate_content(content)
        latency_ms = (time.perf_counter() - start_time) * 1000
        return CheckResponse(
            is_injection=verdict.is_injection,
            confidence=verdict.confidence,
            reasoning=verdict.reasoning,
            triggered_by=verdict.triggered_by,
            matched_patterns=verdict.matched_patterns,
            latency_ms=latency_ms,
            error=None
        )
    except Exception as e:
        logger.error(f"Error evaluating content: {e}")
        latency_ms = (time.perf_counter() - start_time) * 1000
        return CheckResponse(
            is_injection=False,
            confidence=0.0,
            reasoning="Pipeline failed to process request.",
            triggered_by="heuristic",  # valid placeholder value
            matched_patterns=[],
            latency_ms=latency_ms,
            error="Pipeline error. The LLM judge might be unavailable or missing an API key."
        )

@router.post("", response_model=CheckResponse)
async def check_content(request: CheckRequest):
    return await process_content(request.content)

@router.post("/batch", response_model=BatchCheckResponse)
async def check_batch(request: BatchCheckRequest):
    if len(request.items) > 50:
        raise HTTPException(status_code=422, detail="Maximum 50 items allowed per batch request.")
        
    # Concurrency limit of 5
    concurrency = 5
    results = []
    
    for i in range(0, len(request.items), concurrency):
        batch = request.items[i:i+concurrency]
        tasks = [process_content(content) for content in batch]
        batch_results = await asyncio.gather(*tasks)
        results.extend(batch_results)
        
    return BatchCheckResponse(results=results)
