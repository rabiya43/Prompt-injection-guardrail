import os
from typing import Literal
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Model settings
MODEL_NAME = "gemini-2.5-flash"

# Detector settings
# JUDGE_MODE can be "always" or "on_uncertain"
JUDGE_MODE: Literal["always", "on_uncertain"] = "on_uncertain"

# Heuristic thresholds
# If heuristic confidence is > HEURISTIC_SKIP_THRESHOLD, skip the judge
HEURISTIC_SKIP_THRESHOLD = 0.85

# Confidence bounds defining "uncertainty" for the heuristic detector
# Note: If confidence is high, the skip threshold overrides this.
HEURISTIC_UNCERTAIN_LOW = 0.2
HEURISTIC_UNCERTAIN_HIGH = 0.85
