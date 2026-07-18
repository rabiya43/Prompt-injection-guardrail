import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LiveChecker } from './pages/LiveChecker';
import { Shield } from 'lucide-react';
// We will create these shortly
import { EvalDashboard } from './pages/EvalDashboard';
import { AgentSimulation } from './pages/AgentSimulation';

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="bg-brand-600 p-1.5 rounded-lg text-white">
                  <Shield className="w-6 h-6" />
               </div>
               <span className="font-bold text-xl tracking-tight text-slate-900">Guardrail<span className="text-brand-600">AI</span></span>
            </div>
            
            <nav className="flex gap-1">
              <NavLink to="/checker" className={({isActive}: any) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Live Checker</NavLink>
              <NavLink to="/dashboard" className={({isActive}: any) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Eval Dashboard</NavLink>
              <NavLink to="/simulation" className={({isActive}: any) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Agent Simulation</NavLink>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
           <Routes>
              <Route path="/" element={<Navigate to="/checker" replace />} />
              <Route path="/checker" element={<LiveChecker />} />
              <Route path="/dashboard" element={<EvalDashboard />} />
              <Route path="/simulation" element={<AgentSimulation />} />
           </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
