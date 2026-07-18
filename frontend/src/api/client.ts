export interface DetectionVerdict {
  is_injection: boolean;
  confidence: number;
  reasoning: string;
  triggered_by: string;
  matched_patterns: string[];
}

export interface CheckResponse extends DetectionVerdict {
  latency_ms: number;
  tokens_used?: number | null;
  error?: string | null;
}

export interface BatchCheckResponse {
  results: CheckResponse[];
}

export interface FailureCase {
  id: string;
  content: string;
  true_label: string;
  predicted_verdict: string;
  reasoning: string;
  technique?: string | null;
  triggered_by?: string | null;
  confidence?: number | null;
}

export interface MetricsResponse {
  precision: number;
  recall: number;
  f1: number;
  false_positive_rate: number;
  total_cases: number;
  confusion_matrix: Record<string, number>;
  technique_recall: Record<string, number>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiClient = {
  async checkContent(content: string): Promise<CheckResponse> {
    const res = await fetch(`${API_BASE_URL}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return res.json();
  },

  async getMetrics(): Promise<MetricsResponse> {
    const res = await fetch(`${API_BASE_URL}/metrics`, {
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) {
        if (res.status === 404) {
            throw new Error("Metrics not found (404).");
        }
        throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json();
  },

  async getFailures(): Promise<FailureCase[]> {
    const res = await fetch(`${API_BASE_URL}/metrics/failures`, {
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json();
  }
};
