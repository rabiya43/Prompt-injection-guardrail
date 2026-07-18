import re
from typing import List, Tuple
from ..schemas import DetectionVerdict

class HeuristicDetector:
    def __init__(self):
        # We group patterns by category so we can score based on distinct categories matched.
        self.patterns: dict[str, List[re.Pattern]] = {
            "direct_override": [
                re.compile(r"(?i)\b(ignore|disregard)\s+(all\s+)?(previous\s+)?(instructions|directions|prompts)\b"),
                re.compile(r"(?i)\bnew\s+instructions:\b"),
                re.compile(r"(?i)\bsystem\s+override\b"),
                re.compile(r"(?i)\bforget\s+(all\s+)?(previous\s+)?(instructions|directions|prompts)\b")
            ],
            "fake_system_tag": [
                re.compile(r"(?i)\[system\]|<system>"),
                re.compile(r"(?i)^###\s*Instructions", re.MULTILINE),
                re.compile(r"(?i)^(System|Assistant|Human|User):\s", re.MULTILINE)
            ],
            "suspicious_imperative": [
                re.compile(r"(?i)\b(AI|Assistant|LLM),\s+you\s+(must\s+)?(now|immediately)\s+"),
                re.compile(r"(?i)\b(you\s+are\s+now|act\s+as)\s+(an\s+unrestricted|a\s+different)\b")
            ],
            "exfiltration_intent": [
                # Looks for "send to", "forward to", etc., followed loosely by email or URL indicators
                re.compile(r"(?i)\b(send|forward|email|post)\s+(this|the\s+following|all\s+text)\s+(to|at)\s+.*?(mailto:|@|http[s]?://)"),
                re.compile(r"(?i)\bleak\s+(data|history|instructions)\b")
            ],
            "encoded_payload": [
                # Long base64 looking strings (heuristic: 40+ chars of base64 chars without spaces)
                re.compile(r"\b(?:[A-Za-z0-9+/]{40,}={0,2})\b"),
                # Zero-width characters (ZWJ, ZWNJ, LRM, RLM, etc.)
                re.compile(r"[\u200B-\u200D\uFEFF]"),
                # Unusual unicode homoglyphs / combining characters clustered
                re.compile(r"[\u0300-\u036F]{3,}")
            ]
        }

        # Words that might be common in innocuous contexts but shouldn't trigger alone.
        # Hard negative check handled implicitly by making the above regexes strict enough.

    def detect(self, content: str) -> DetectionVerdict:
        matched_categories = set()
        matched_patterns_strings = []
        total_matches = 0

        for category, regex_list in self.patterns.items():
            for regex in regex_list:
                matches = regex.findall(content)
                if matches:
                    matched_categories.add(category)
                    matched_patterns_strings.append(f"{category} ({regex.pattern})")
                    total_matches += len(matches)

        is_injection = len(matched_categories) > 0
        content_length = len(content)
        
        # Dynamic confidence scoring based on distinct categories, total matches, and length
        if len(matched_categories) == 0:
            import string
            punct_count = sum(1 for c in content if c in string.punctuation)
            caps_count = sum(1 for c in content if c.isupper())
            punct_density = punct_count / max(1, content_length)
            caps_density = caps_count / max(1, content_length)
            
            # Yields a wide spread from ~0.02 to ~0.45 based on text structure
            confidence = min(0.49, (punct_density * 2.0) + (caps_density * 0.8))
            reasoning = "No heuristic patterns matched. Variance based on punctuation/caps density."
        else:
            base_confidence = 0.5
            cat_bonus = len(matched_categories) * 0.15
            match_bonus = (total_matches - 1) * 0.05
            
            confidence = min(0.99, base_confidence + cat_bonus + match_bonus + (content_length / 5000.0))
            reasoning = f"Matched {len(matched_categories)} heuristic categories with {total_matches} total matches."

        return DetectionVerdict(
            is_injection=is_injection,
            confidence=confidence,
            reasoning=reasoning,
            triggered_by="heuristic",
            matched_patterns=matched_patterns_strings
        )

def detect(content: str) -> DetectionVerdict:
    """Convenience function for the pipeline to call."""
    detector = HeuristicDetector()
    return detector.detect(content)
