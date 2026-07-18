from typing import Literal, List, Optional, Dict
from pydantic import BaseModel, Field

class DetectionVerdict(BaseModel):
    is_injection: bool = Field(description="True if the content is classified as a prompt injection attempt")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    reasoning: str = Field(description="Explanation for the classification")
    triggered_by: Literal["heuristic", "llm_judge", "both"] = Field(description="Which detector made the final call")
    matched_patterns: List[str] = Field(default_factory=list, description="List of matched heuristic patterns, if any")

class TestCase(BaseModel):
    id: str = Field(description="Unique identifier for the test case")
    content: str = Field(description="The actual content to be evaluated")
    label: Literal["clean", "injected"] = Field(description="Ground truth label")
    injection_technique: Optional[str] = Field(
        default=None, 
        description="The technique used if label is 'injected' (e.g., 'direct_override', 'fake_system_tag', etc.)"
    )

class EvalResult(BaseModel):
    precision: float = Field(description="Overall precision score")
    recall: float = Field(description="Overall recall score")
    f1: float = Field(description="Overall F1 score")
    false_positive_rate: float = Field(description="Overall false positive rate")
    total_cases: int = Field(description="Total number of cases evaluated")
    confusion_matrix: Dict[str, int] = Field(description="Confusion matrix counts (TP, TN, FP, FN)")
