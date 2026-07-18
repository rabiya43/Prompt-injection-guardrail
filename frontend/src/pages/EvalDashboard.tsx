import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { MetricsResponse, FailureCase } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';

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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-[#00ff88] animate-pulse font-bold tracking-widest uppercase">Loading Core Metrics...</div>;
  }

  if (error || !metrics) {
    return (
      <div className="max-w-3xl mx-auto mt-12 text-center relative z-20">
        <TiltCard>
          <div className="bg-[#161930]/80 p-8 rounded-xl border border-[#2a2e4a] backdrop-blur-md shadow-[0_0_20px_rgba(255,0,0,0.1)]">
             <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
             <h2 className="text-2xl font-bold text-white tracking-wide">No Evaluation Data Available</h2>
             <p className="text-slate-400 mt-4">
               {error?.includes("404") 
                 ? "The evaluation harness has not been run yet. Please run python eval/run_eval.py on the backend to generate metrics."
                 : error || "Failed to load metrics."}
             </p>
          </div>
        </TiltCard>
      </div>
    );
  }

  const chartData = Object.entries(metrics.technique_recall)
    .map(([tech, recall]) => ({ name: tech, recall: recall * 100 }))
    .sort((a, b) => a.recall - b.recall);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 relative z-20">
      
      {/* Known Limitations Box */}
      <TiltCard>
        <div className="bg-amber-950/40 border border-amber-500/50 p-6 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md">
           <h3 className="flex items-center gap-3 font-bold text-amber-400 text-lg tracking-wide"><Info className="w-6 h-6"/> Honest Assessment: Known Limitations</h3>
           <ul className="list-disc pl-6 mt-4 space-y-2 text-sm text-amber-200/80 font-medium">
              <li><strong>Subtle Semantic Injections:</strong> The <code className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50 font-mono text-xs">subtle_semantic</code> category remains incredibly difficult to catch. Injections that look like plausible diagnostic requests may bypass both the heuristics and the LLM judge.</li>
              <li><strong>False Positives:</strong> Legitimate content discussing security, AI, or prompt injection has a higher likelihood of triggering the heuristic pass.</li>
              <li><strong>Latency:</strong> The LLM judge pass requires API calls, adding latency. High-confidence heuristic matches bypass this to optimize cost/latency.</li>
           </ul>
        </div>
      </TiltCard>

      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]">Evaluation Dashboard</h1>
        <p className="text-[#00ff88] mt-2 font-medium">Based on {metrics.total_cases} synthetic test cases.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard title="Precision" value={`${(metrics.precision * 100).toFixed(1)}%`} color="#00ff88" />
        <StatCard title="Recall" value={`${(metrics.recall * 100).toFixed(1)}%`} color="#00ff88" />
        <StatCard title="F1 Score" value={`${(metrics.f1 * 100).toFixed(1)}%`} color="#3b82f6" />
        <StatCard title="False Pos. Rate" value={`${(metrics.false_positive_rate * 100).toFixed(1)}%`} color="#ef4444" />
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-8">
        {/* Recall Chart */}
        <TiltCard className="h-full">
          <div className="bg-[#161930]/80 p-8 rounded-xl border border-[#2a2e4a] shadow-xl backdrop-blur-md h-full flex flex-col">
             <h3 className="font-bold text-white mb-8 tracking-wider uppercase flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]"></span> Recall by Technique</h3>
             <div className="h-[300px] flex-1">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                   <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#475569" tick={{fill: '#94a3b8'}} />
                   <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12, fill: '#cbd5e1'}} stroke="#475569" />
                   <Tooltip 
                     formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Recall']} 
                     contentStyle={{ backgroundColor: '#0f1123', borderColor: '#2a2e4a', color: '#fff', borderRadius: '8px' }}
                     itemStyle={{ color: '#00ff88' }}
                   />
                   <Bar dataKey="recall" radius={[0, 4, 4, 0]}>
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.recall < 50 ? '#ef4444' : entry.recall < 80 ? '#f59e0b' : '#00ff88'} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </TiltCard>

        {/* Confusion Matrix */}
        <TiltCard className="h-full">
          <div className="bg-[#161930]/80 p-8 rounded-xl border border-[#2a2e4a] shadow-xl backdrop-blur-md h-full flex flex-col items-center justify-center">
             <h3 className="font-bold text-white mb-8 tracking-wider uppercase self-start flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span> Confusion Matrix</h3>
             <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
                <div className="aspect-square bg-[#00ff88]/10 text-[#00ff88] rounded-xl flex flex-col items-center justify-center p-2 text-center border border-[#00ff88]/30 shadow-[inset_0_0_15px_rgba(0,255,136,0.1)]">
                   <span className="text-3xl font-black drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]">{metrics.confusion_matrix.TP}</span>
                   <span className="text-xs font-bold uppercase mt-1 opacity-80">True Pos</span>
                </div>
                <div className="aspect-square bg-red-500/10 text-red-400 rounded-xl flex flex-col items-center justify-center p-2 text-center border border-red-500/30 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]">
                   <span className="text-3xl font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">{metrics.confusion_matrix.FP}</span>
                   <span className="text-xs font-bold uppercase mt-1 opacity-80">False Pos</span>
                </div>
                <div className="aspect-square bg-orange-500/10 text-orange-400 rounded-xl flex flex-col items-center justify-center p-2 text-center border border-orange-500/30 shadow-[inset_0_0_15px_rgba(249,115,22,0.1)]">
                   <span className="text-3xl font-black drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">{metrics.confusion_matrix.FN}</span>
                   <span className="text-xs font-bold uppercase mt-1 opacity-80">False Neg</span>
                </div>
                <div className="aspect-square bg-slate-500/10 text-slate-300 rounded-xl flex flex-col items-center justify-center p-2 text-center border border-slate-500/30 shadow-[inset_0_0_15px_rgba(148,163,184,0.1)]">
                   <span className="text-3xl font-black drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]">{metrics.confusion_matrix.TN}</span>
                   <span className="text-xs font-bold uppercase mt-1 opacity-80">True Neg</span>
                </div>
             </div>
          </div>
        </TiltCard>
      </div>

      {/* Failure Cases */}
      <div className="bg-[#161930]/80 rounded-xl border border-[#2a2e4a] shadow-xl backdrop-blur-md overflow-hidden">
        <div className="px-8 py-5 border-b border-[#2a2e4a] bg-[#0a0b14]/50">
           <h3 className="font-bold text-white tracking-wider uppercase flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span> Failure Cases ({failures.length})</h3>
        </div>
          <div className="divide-y divide-[#2a2e4a]">
            {failures.slice(0, visibleCount).map((f) => (
               <div key={f.id} className="p-5 hover:bg-[#2a2e4a]/30 transition-colors">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedFailure(expandedFailure === f.id ? null : f.id)}
                  >
                     <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-widest border ${f.true_label === 'clean' ? 'bg-red-950/50 text-red-400 border-red-500/30' : 'bg-orange-950/50 text-orange-400 border-orange-500/30'}`}>
                           {f.true_label === 'clean' ? 'FALSE POSITIVE' : 'FALSE NEGATIVE'}
                        </span>
                        <span className="text-sm font-medium text-slate-300 truncate max-w-[200px] md:max-w-[400px]">
                          {f.technique ? <span className="text-[#00ff88] mr-2">[{f.technique}]</span> : ''}{f.content}
                        </span>
                     </div>
                     {expandedFailure === f.id ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                  </div>
                  
                  {expandedFailure === f.id && (
                    <div className="mt-5 pl-5 border-l-2 border-[#00ff88]/50 space-y-4 text-sm animate-in slide-in-from-top-2 duration-200">
                       <div>
                         <strong className="text-white">Triggered By:</strong> <span className="font-mono text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded">{f.triggered_by}</span> <span className="text-slate-400">(Conf: {f.confidence})</span>
                       </div>
                       <div>
                         <strong className="text-white">Reasoning:</strong>
                         <p className="text-slate-300 mt-1">{f.reasoning}</p>
                       </div>
                       <div>
                         <strong className="text-white">Full Content:</strong>
                         <pre className="mt-2 p-4 bg-[#0a0b14] rounded-lg text-xs text-[#00ff88] whitespace-pre-wrap font-mono border border-[#2a2e4a] shadow-inner max-h-[300px] overflow-auto">{f.content}</pre>
                       </div>
                    </div>
                  )}
               </div>
            ))}
            {visibleCount < failures.length && (
              <div className="p-6 text-center">
                <button 
                  onClick={() => setVisibleCount(v => v + 15)}
                  className="px-6 py-2 bg-[#2a2e4a] hover:bg-[#3b4168] text-white rounded-lg text-sm font-bold tracking-wider uppercase transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
            {failures.length === 0 && <div className="p-12 text-center text-[#00ff88] font-medium">System is perfectly secure. No failures found.</div>}
          </div>
        </div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string, color: string}> = ({title, value, color}) => (
  <TiltCard>
    <div className="bg-[#161930]/80 p-6 rounded-xl border border-[#2a2e4a] shadow-xl backdrop-blur-md flex flex-col justify-center h-full">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</div>
      <div className="text-4xl font-black mt-2 drop-shadow-[0_0_10px_currentColor]" style={{ color }}>{value}</div>
    </div>
  </TiltCard>
);
