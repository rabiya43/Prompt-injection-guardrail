# Prompt Injection Guardrail

A robust, full-stack guardrail layer designed to sit between an LLM agent and external content. It detects prompt injection attempts (hidden or embedded instructions) before they can reach the agent's context window.

## Architecture & Product Setup

This project has been upgraded to a full-stack product featuring:
- **Backend**: FastAPI serving a two-pass detection pipeline (Heuristic + LLM Judge).
- **Frontend**: React (Vite) + Tailwind CSS dashboard with a live checker, evaluation metrics visualization, and an agent simulation diagram.
- **Infrastructure**: Fully Dockerized with CI/CD via GitHub Actions.

Please refer to [`docs/architecture.md`](docs/architecture.md) for full architectural details, deployment instructions, and production gaps.

## Running the Full Stack

### Using Docker Compose (Recommended)
You can run the entire stack (API and Frontend) using Docker Compose:
```bash
docker-compose up --build
```
- Frontend UI: http://localhost:80
- Backend API: http://localhost:8000

### Running Locally without Docker

**1. Backend (FastAPI)**
```bash
python -m venv venv
# Windows: .\venv\Scripts\activate
# Unix: source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

**2. Frontend (React/Vite)**
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Navigate to http://localhost:5173.

## Evaluation & Metrics

The system uses a two-pass architecture. Run the evaluation harness to generate performance metrics:
```bash
# Must be run from the root of the project
python eval/run_eval.py
```
This will populate `results/metrics.json` and `results/failure_cases.md`, which are immediately consumed and visualized by the frontend `EvalDashboard`.

## Known Limitations

- **Subtle Semantic Injections:** The `subtle_semantic` category is the hardest to detect reliably. Injections framed as benign requests or diagnostic commands often bypass both the regex heuristics and the LLM judge.
- **False Positives on Security Content:** The heuristic pass may flag legitimate content that discusses prompt injection techniques, roleplay rules, or security testing.
- **Judge Latency:** The LLM judge pass incurs external API latency. The pipeline is designed to skip the judge if heuristic confidence is very high.
