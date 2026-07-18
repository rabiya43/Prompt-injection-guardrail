import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LiveChecker } from './pages/LiveChecker';
import { Shield, Zap } from 'lucide-react';
import { EvalDashboard } from './pages/EvalDashboard';
import { AgentSimulation } from './pages/AgentSimulation';
import { Canvas } from '@react-three/fiber';
import { SecurityScene } from './components/SecurityScene';

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050511] text-slate-200 flex flex-col relative overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <color attach="background" args={['#050511']} />
            <ambientLight intensity={0.5} />
            <SecurityScene />
          </Canvas>
        </div>
        
        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="bg-[#0f1123]/80 backdrop-blur-md border-b border-[#2a2e4a] sticky top-0 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-[#00ff88]/20 p-1.5 rounded-lg text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.3)]">
                    <Shield className="w-6 h-6" />
                 </div>
                 <span className="font-bold text-xl tracking-tight text-white">Guardrail<span className="text-[#00ff88]">AI</span></span>
              </div>
              
              <nav className="flex gap-2">
                <NavLink to="/checker" className={({isActive}: any) => `px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-[inset_0_0_10px_rgba(0,255,136,0.2)]' : 'text-slate-400 hover:text-[#00ff88] hover:bg-[#00ff88]/5'}`}>Live Checker</NavLink>
                <NavLink to="/dashboard" className={({isActive}: any) => `px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-[inset_0_0_10px_rgba(0,255,136,0.2)]' : 'text-slate-400 hover:text-[#00ff88] hover:bg-[#00ff88]/5'}`}>Eval Dashboard</NavLink>
                <NavLink to="/simulation" className={({isActive}: any) => `px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-[inset_0_0_10px_rgba(0,255,136,0.2)]' : 'text-slate-400 hover:text-[#00ff88] hover:bg-[#00ff88]/5'}`}>Agent Simulation</NavLink>
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
             <div className="bg-[#0f1123]/60 backdrop-blur-lg border border-[#2a2e4a] rounded-xl shadow-2xl overflow-hidden p-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/checker" replace />} />
                  <Route path="/checker" element={<LiveChecker />} />
                  <Route path="/dashboard" element={<EvalDashboard />} />
                  <Route path="/simulation" element={<AgentSimulation />} />
                </Routes>
             </div>
          </main>
          
          <footer className="bg-[#0f1123]/90 border-t border-[#2a2e4a] py-6 text-center text-sm text-slate-500 backdrop-blur-md">
             <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-[#00ff88]" />
                <p>Powered by GuardrailAI Engine | Securing prompts in real-time</p>
             </div>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
