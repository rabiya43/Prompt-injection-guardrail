import React from 'react';
import { ShieldAlert, ShieldCheck, Clock, Activity } from 'lucide-react';
import type { CheckResponse } from '../api/client';

export const VerdictCard: React.FC<{ result: CheckResponse }> = ({ result }) => {
  const isInjection = result.is_injection;
  
  return (
    <div className={`p-6 rounded-xl border ${isInjection ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_20px_rgba(255,0,0,0.2)]' : 'bg-[#00ff88]/10 border-[#00ff88]/50 shadow-[0_0_20px_rgba(0,255,136,0.2)]'} backdrop-blur-md`}>
      
      {result.error && (
        <div className="mb-4 p-3 bg-yellow-900/40 text-yellow-200 rounded border border-yellow-500/50 text-sm">
          <strong>Warning:</strong> {result.error}
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {isInjection ? (
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-[#00ff88]" />
          )}
          <div>
            <h3 className={`text-xl font-bold ${isInjection ? 'text-red-400' : 'text-[#00ff88]'}`}>
              {isInjection ? 'Injection Detected' : 'Content Clean'}
            </h3>
            <p className={`text-sm font-medium mt-1 inline-block px-2 py-0.5 rounded ${
              result.triggered_by === 'heuristic' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/50' : 
              result.triggered_by === 'llm_judge' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/50' : 
              result.triggered_by === 'error' ? 'bg-gray-800 text-gray-300' :
              'bg-orange-900/50 text-orange-300'
            }`}>
              Detected By: {result.triggered_by.toUpperCase()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className={`text-3xl font-black ${isInjection ? 'text-red-400' : 'text-[#00ff88]'} drop-shadow-[0_0_8px_currentColor]`}>
              {(result.confidence * 100).toFixed(0)}%
           </div>
           <div className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Confidence</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Reasoning</h4>
          <p className="text-slate-200 bg-[#0a0b14]/80 p-4 rounded-lg border border-[#2a2e4a]">{result.reasoning}</p>
        </div>

        {result.matched_patterns && result.matched_patterns.length > 0 && (
          <div>
             <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Matched Patterns</h4>
             <div className="flex flex-wrap gap-2">
                {result.matched_patterns.map((p, i) => (
                  <span key={i} className="text-xs bg-red-900/40 text-red-300 px-3 py-1.5 rounded-md font-mono border border-red-500/30">
                    {p}
                  </span>
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs font-mono text-slate-500 pt-4 border-t border-black/5">
         <div className="flex items-center gap-1"><Clock className="w-3 h-3"/> {result.latency_ms.toFixed(1)}ms latency</div>
         {result.tokens_used && <div className="flex items-center gap-1"><Activity className="w-3 h-3"/> {result.tokens_used} tokens</div>}
      </div>
    </div>
  );
};
