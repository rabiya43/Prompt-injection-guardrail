import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { MetricsResponse, FailureCase } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export const EvalDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [failures, setFailures] = useState<FailureCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFailure, setExpandedFailure] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, f] = await Promise.all([
          apiClient.getMetrics(),
          apiClient.getFailures()
        ]);
        setMetrics(m);
        setFailures(f);
      } catch (err: any) {
        // A 404 from getMetrics will throw an error with "404" in the message, handled by client.ts
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse">Loading evaluation metrics...</div>;
  }

  if (error || !metrics) {
    return (
      <div className="max-w-3xl mx-auto mt-12 text-center">
        <div className="bg-slate-100 p-8 rounded-xl border border-slate-200">
           <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
           <h2 className="text-xl font-bold text-slate-700">No Evaluation Data Available</h2>
           <p className="text-slate-500 mt-2">
             {error?.includes("404") 
               ? "The evaluation harness has not been run yet. Please run python eval/run_eval.py on the backend to generate metrics."
               : error || "Failed to load metrics."}
           </p>
        </div>
      </div>
    );
  }

  // Prepare chart data (sorted ascending to show weakest categories at top)
  const chartData = Object.entries(metrics.technique_recall)
    .map(([tech, recall]) => ({ name: tech, recall: recall * 100 }))
    .sort((a, b) => a.recall - b.recall);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Known Limitations Box */}
      <div className="bg-amber-50 border border-amber-200 p-5 rounded-lg shadow-sm">
         <h3 className="flex items-center gap-2 font-bold text-amber-900"><Info className="w-5 h-5"/> Honest Assessment: Known Limitations</h3>
         <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-amber-800">
            <li><strong>Subtle Semantic Injections:</strong> The <code>subtle_semantic</code> category remains incredibly difficult to catch. Injections that look like plausible diagnostic requests may bypass both the heuristics and the LLM judge.</li>
            <li><strong>False Positives:</strong> Legitimate content discussing security, AI, or prompt injection has a higher likelihood of triggering the heuristic pass.</li>
            <li><strong>Latency:</strong> The LLM judge pass requires API calls, adding latency. High-confidence heuristic matches bypass this to optimize cost/latency.</li>
         </ul>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Evaluation Dashboard</h1>
        <p className="text-slate-500 mt-1">Based on {metrics.total_cases} synthetic test cases.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Precision" value={`${(metrics.precision * 100).toFixed(1)}%`} />
        <StatCard title="Recall" value={`${(metrics.recall * 100).toFixed(1)}%`} />
        <StatCard title="F1 Score" value={`${(metrics.f1 * 100).toFixed(1)}%`} />
        <StatCard title="False Pos. Rate" value={`${(metrics.false_positive_rate * 100).toFixed(1)}%`} />
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-6">
        {/* Recall Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-6">Recall by Technique (Weakest at top)</h3>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                 <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                 <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                 <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Recall']} />
                 <Bar dataKey="recall" radius={[0, 4, 4, 0]}>
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.recall < 50 ? '#ef4444' : entry.recall < 80 ? '#eab308' : '#22c55e'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
           <h3 className="font-bold text-slate-800 mb-6 self-start">Confusion Matrix</h3>
           <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
              <div className="aspect-square bg-green-100 text-green-900 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-green-200">
                 <span className="text-2xl font-black">{metrics.confusion_matrix.TP}</span>
                 <span className="text-xs font-semibold uppercase">True Pos</span>
              </div>
              <div className="aspect-square bg-red-100 text-red-900 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-red-200">
                 <span className="text-2xl font-black">{metrics.confusion_matrix.FP}</span>
                 <span className="text-xs font-semibold uppercase">False Pos</span>
              </div>
              <div className="aspect-square bg-orange-100 text-orange-900 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-orange-200">
                 <span className="text-2xl font-black">{metrics.confusion_matrix.FN}</span>
                 <span className="text-xs font-semibold uppercase">False Neg</span>
              </div>
              <div className="aspect-square bg-slate-100 text-slate-900 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-slate-200">
                 <span className="text-2xl font-black">{metrics.confusion_matrix.TN}</span>
                 <span className="text-xs font-semibold uppercase">True Neg</span>
              </div>
           </div>
        </div>
      </div>

      {/* Failure Cases */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
           <h3 className="font-bold text-slate-800">Failure Cases ({failures.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {failures.slice(0, visibleCount).map((f) => (
             <div key={f.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedFailure(expandedFailure === f.id ? null : f.id)}
                >
                   <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${f.true_label === 'clean' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                         {f.true_label === 'clean' ? 'FALSE POSITIVE' : 'FALSE NEGATIVE'}
                      </span>
                      <span className="text-sm font-medium text-slate-700 truncate max-w-[200px] md:max-w-[400px]">
                        {f.technique ? `[${f.technique}] ` : ''}{f.content}
                      </span>
                   </div>
                   {expandedFailure === f.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
                
                {expandedFailure === f.id && (
                  <div className="mt-4 pl-4 border-l-2 border-slate-200 space-y-3 text-sm animate-in slide-in-from-top-2 duration-200">
                     <div>
                       <strong className="text-slate-700">Triggered By:</strong> <span className="font-mono">{f.triggered_by}</span> (Conf: {f.confidence})
                     </div>
                     <div>
                       <strong className="text-slate-700">Reasoning:</strong>
                       <p className="text-slate-600 mt-1">{f.reasoning}</p>
                     </div>
                     <div>
                       <strong className="text-slate-700">Full Content:</strong>
                       <pre className="mt-1 p-3 bg-slate-100 rounded text-xs text-slate-800 whitespace-pre-wrap font-mono border border-slate-200">{f.content}</pre>
                     </div>
                  </div>
                )}
             </div>
          ))}
          {visibleCount < failures.length && (
            <div className="p-4 text-center">
              <button 
                onClick={() => setVisibleCount(v => v + 15)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Load More
              </button>
            </div>
          )}
          {failures.length === 0 && <div className="p-8 text-center text-slate-500">No failures found.</div>}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string}> = ({title, value}) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</div>
    <div className="text-3xl font-black text-slate-800 mt-1">{value}</div>
  </div>
);
