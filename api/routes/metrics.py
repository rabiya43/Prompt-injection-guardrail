import json
import os
from fastapi import APIRouter, HTTPException
from api.models import MetricsResponse, FailureCase

router = APIRouter(prefix="/metrics", tags=["metrics"])

METRICS_FILE = "results/metrics.json"
FAILURES_FILE = "results/failure_cases.json"

@router.get("", response_model=MetricsResponse)
async def get_metrics():
    if not os.path.exists(METRICS_FILE):
        raise HTTPException(
            status_code=404, 
            detail="Metrics file not found. Please run the evaluation harness (`python eval/run_eval.py`) first."
        )
        
    try:
        with open(METRICS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read metrics: {str(e)}")

@router.get("/failures", response_model=list[FailureCase])
async def get_failures():
    if not os.path.exists(FAILURES_FILE):
        raise HTTPException(
            status_code=404, 
            detail="Failures file not found. Please run the evaluation harness first."
        )
        
    try:
        with open(FAILURES_FILE, "r", encoding="utf-8") as f:
            failures_data = json.load(f)
            
        failures = []
        for item in failures_data:
            failures.append(FailureCase(**item))
            
        return failures
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse failures: {str(e)}")
