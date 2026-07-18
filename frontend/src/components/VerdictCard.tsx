import React from 'react';
import { ShieldAlert, ShieldCheck, Clock, Activity } from 'lucide-react';
import type { CheckResponse } from '../api/client';

export const VerdictCard: React.FC<{ result: CheckResponse }> = ({ result }) => {
  const isInjection = result.is_injection;
  
  return (
    <div className={`p-6 rounded-xl border ${isInjection ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} shadow-sm`}>
      
      {result.error && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 text-sm">
          <strong>Warning:</strong> {result.error}
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {isInjection ? (
            <ShieldAlert className="w-8 h-8 text-red-600" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-green-600" />
          )}
          <div>
            <h3 className={`text-xl font-bold ${isInjection ? 'text-red-900' : 'text-green-900'}`}>
              {isInjection ? 'Injection Detected' : 'Content Clean'}
            </h3>
            <p className={`text-sm font-medium mt-1 inline-block px-2 py-0.5 rounded ${
              result.triggered_by === 'heuristic' ? 'bg-blue-100 text-blue-800' : 
              result.triggered_by === 'llm_judge' ? 'bg-purple-100 text-purple-800' : 
              result.triggered_by === 'error' ? 'bg-gray-200 text-gray-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              Detected By: {result.triggered_by.toUpperCase()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className="text-2xl font-black text-slate-800">
              {(result.confidence * 100).toFixed(0)}%
           </div>
           <div className="text-xs text-slate-500 uppercase font-semibold">Confidence</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-1">Reasoning</h4>
          <p className="text-slate-800 bg-white/50 p-3 rounded border border-white/60">{result.reasoning}</p>
        </div>

        {result.matched_patterns && result.matched_patterns.length > 0 && (
          <div>
             <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Matched Patterns</h4>
             <div className="flex flex-wrap gap-2">
                {result.matched_patterns.map((p, i) => (
                  <span key={i} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-mono border border-red-200">
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
