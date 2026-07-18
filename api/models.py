from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from src.schemas import DetectionVerdict

class CheckRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=50000, description="The content to be evaluated for prompt injection.")

class CheckResponse(BaseModel):
    is_injection: bool = Field(description="True if the content is classified as a prompt injection attempt")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    reasoning: str = Field(description="Explanation for the classification")
    triggered_by: str = Field(description="Which detector made the final call")
    matched_patterns: List[str] = Field(default_factory=list, description="List of matched heuristic patterns, if any")
    latency_ms: float = Field(description="Time taken to evaluate the content in milliseconds")
    tokens_used: Optional[int] = Field(default=None, description="Tokens used by the LLM judge, if applicable")
    error: Optional[str] = Field(default=None, description="Error message if the judge failed")

class BatchCheckRequest(BaseModel):
    items: List[str] = Field(..., min_length=1, max_length=50, description="List of contents to be evaluated")

class BatchCheckResponse(BaseModel):
    results: List[CheckResponse] = Field(description="List of evaluation results corresponding to the input items")

class FailureCase(BaseModel):
    id: str
    content: str
    true_label: str
    predicted_verdict: str
    reasoning: str
    technique: Optional[str] = None
    triggered_by: Optional[str] = None
    confidence: Optional[float] = None

class MetricsResponse(BaseModel):
    precision: float
    recall: float
    f1: float
    false_positive_rate: float
    total_cases: int
    confusion_matrix: Dict[str, int]
    technique_recall: Dict[str, float]
