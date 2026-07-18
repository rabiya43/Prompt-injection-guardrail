import asyncio
import json
import logging
import os
from typing import List, Dict, Any
from src.schemas import TestCase, DetectionVerdict, EvalResult
from src.detectors.pipeline import evaluate_content

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def process_batch(batch: List[TestCase]) -> List[tuple[TestCase, DetectionVerdict]]:
    tasks = [evaluate_content(case.content) for case in batch]
    verdicts = await asyncio.gather(*tasks)
    return list(zip(batch, verdicts))

async def run_evaluation(input_file: str, metrics_out: str, failures_out: str, failures_json_out: str):
    logger.info(f"Loading test set from {input_file}...")
    
    cases = []
    with open(input_file, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            cases.append(TestCase(**json.loads(line)))
            
    logger.info(f"Loaded {len(cases)} cases.")
    
    # Process with concurrency limit of 5
    concurrency = 5
    results: List[tuple[TestCase, DetectionVerdict]] = []
    
    for i in range(0, len(cases), concurrency):
        batch = cases[i:i+concurrency]
        logger.info(f"Processing batch {i//concurrency + 1}/{(len(cases)+concurrency-1)//concurrency}...")
        batch_results = await process_batch(batch)
        results.extend(batch_results)
        
    # Compute metrics
    tp = fp = tn = fn = 0
    technique_stats: Dict[str, Dict[str, int]] = {}
    failure_cases = []
    
    for case, verdict in results:
        is_true_injection = (case.label == "injected")
        
        if is_true_injection:
            tech = case.injection_technique or "unknown"
            if tech not in technique_stats:
                technique_stats[tech] = {"total": 0, "detected": 0}
            technique_stats[tech]["total"] += 1
            
            if verdict.is_injection:
                tp += 1
                technique_stats[tech]["detected"] += 1
            else:
                fn += 1
                failure_cases.append((case, verdict, "False Negative"))
        else:
            if verdict.is_injection:
                fp += 1
                failure_cases.append((case, verdict, "False Positive"))
            else:
                tn += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    
    eval_result = EvalResult(
        precision=precision,
        recall=recall,
        f1=f1,
        false_positive_rate=fpr,
        total_cases=len(cases),
        confusion_matrix={"TP": tp, "TN": tn, "FP": fp, "FN": fn}
    )
    
    # Save metrics
    metrics_data = eval_result.model_dump()
    metrics_data["technique_recall"] = {
        k: (v["detected"] / v["total"] if v["total"] > 0 else 0.0)
        for k, v in technique_stats.items()
    }
    
    os.makedirs(os.path.dirname(metrics_out), exist_ok=True)
    with open(metrics_out, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
        
    # Save failures
    with open(failures_out, "w", encoding="utf-8") as f:
        f.write("# Evaluation Failure Cases\n\n")
        f.write(f"Total failures: {len(failure_cases)}\n\n")
        
        for case, verdict, fail_type in failure_cases:
            f.write(f"## {fail_type} (ID: {case.id})\n")
            if case.injection_technique:
                f.write(f"**Technique:** {case.injection_technique}\n")
            f.write(f"**Triggered By:** {verdict.triggered_by}\n")
            f.write(f"**Confidence:** {verdict.confidence}\n")
            f.write(f"**Reasoning:** {verdict.reasoning}\n")
            f.write(f"### Content\n```text\n{case.content}\n```\n\n---\n\n")

    # Save failures as JSON
    failures_json_data = []
    for case, verdict, fail_type in failure_cases:
        failures_json_data.append({
            "id": case.id,
            "content": case.content,
            "true_label": "clean" if fail_type == "False Positive" else "injected",
            "predicted_verdict": "injected" if fail_type == "False Positive" else "clean",
            "reasoning": verdict.reasoning,
            "technique": case.injection_technique,
            "triggered_by": verdict.triggered_by,
            "confidence": verdict.confidence
        })
        
    with open(failures_json_out, "w", encoding="utf-8") as f:
        json.dump(failures_json_data, f, indent=2)
            
    # Print summary
    print("\n" + "="*40)
    print("EVALUATION SUMMARY")
    print("="*40)
    print(f"Total Cases: {len(cases)}")
    print(f"Precision:   {precision:.2%}")
    print(f"Recall:      {recall:.2%}")
    print(f"F1 Score:    {f1:.2%}")
    print(f"FPR:         {fpr:.2%}")
    print("\nConfusion Matrix:")
    print(f"  TP: {tp:<5} | FP: {fp}")
    print(f"  FN: {fn:<5} | TN: {tn}")
    print("\nRecall by Technique:")
    for tech, stats in technique_stats.items():
        rec = stats["detected"] / stats["total"] if stats["total"] > 0 else 0.0
        print(f"  {tech:<25} {rec:.2%} ({stats['detected']}/{stats['total']})")
    print("="*40)
    print(f"Metrics saved to {metrics_out}")
    print(f"Failures saved to {failures_out}")

if __name__ == "__main__":
    asyncio.run(run_evaluation(
        input_file="data/test_set.jsonl",
        metrics_out="results/metrics.json",
        failures_out="results/failure_cases.md",
        failures_json_out="results/failure_cases.json"
    ))
