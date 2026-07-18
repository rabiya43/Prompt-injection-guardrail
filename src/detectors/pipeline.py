from ..schemas import DetectionVerdict
from .heuristic_detector import HeuristicDetector
from .llm_judge_detector import LLMJudgeDetector
from ..config import JUDGE_MODE, HEURISTIC_SKIP_THRESHOLD, HEURISTIC_UNCERTAIN_LOW, HEURISTIC_UNCERTAIN_HIGH

heuristic_detector = HeuristicDetector()
llm_judge_detector = LLMJudgeDetector()

async def evaluate_content(content: str) -> DetectionVerdict:
    heuristic_verdict = heuristic_detector.detect(content)
    
    if JUDGE_MODE == "on_uncertain":
        # If the heuristic is highly confident it's an injection, skip the judge to save cost/latency
        if heuristic_verdict.confidence >= HEURISTIC_SKIP_THRESHOLD:
            return heuristic_verdict
            
        # If the heuristic is somewhat confident it's NOT an injection, skip the judge to save cost
        if heuristic_verdict.confidence < HEURISTIC_UNCERTAIN_LOW:
            return heuristic_verdict
            
        # Otherwise, it falls in the uncertain zone (e.g. 0.2 to 0.85) -> Call Judge
        judge_verdict = await llm_judge_detector.detect(content)
        return _combine_verdicts(heuristic_verdict, judge_verdict)
        
    elif JUDGE_MODE == "always":
        judge_verdict = await llm_judge_detector.detect(content)
        return _combine_verdicts(heuristic_verdict, judge_verdict)
        
    else:
        raise ValueError(f"Unknown JUDGE_MODE: {JUDGE_MODE}")

def _combine_verdicts(heuristic: DetectionVerdict, judge: DetectionVerdict) -> DetectionVerdict:
    is_injection = heuristic.is_injection or judge.is_injection
    confidence = max(heuristic.confidence, judge.confidence)
    reasoning = f"Heuristic: {heuristic.reasoning} | Judge: {judge.reasoning}"
    matched_patterns = heuristic.matched_patterns
    
    return DetectionVerdict(
        is_injection=is_injection,
        confidence=confidence,
        reasoning=reasoning,
        triggered_by="both",
        matched_patterns=matched_patterns
    )
