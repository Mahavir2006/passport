import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import PassportPage from "./pages/PassportPage.jsx";
import VisaPage from "./pages/VisaPage.jsx";
import ImmigrationPage from "./pages/ImmigrationPage.jsx";
import StampsPage from "./pages/StampsPage.jsx";
import TrustPage from "./pages/TrustPage.jsx";
import BlacklistPage from "./pages/BlacklistPage.jsx";
import { api } from "./lib/api.js";

export default function App() {
  const [agentId, setAgentId] = useState(() => localStorage.getItem("agentId") || null);
  const [agent, setAgent] = useState(null);
  const [latestTxHash, setLatestTxHash] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.onTx = (hash) => {
      setLatestTxHash(hash);
      setTimeout(() => setLatestTxHash(null), 15000);
    };
  }, []);

  useEffect(() => {
    if (agentId && agentId !== "undefined") {
      localStorage.setItem("agentId", agentId);
      api.getAgent(agentId).then(setAgent).catch(() => {
        localStorage.removeItem("agentId");
        setAgentId(null);
      });
    } else {
      localStorage.removeItem("agentId");
    }
  }, [agentId]);

  const refreshAgent = async () => {
    if (!agentId) return;
    const fresh = await api.getAgent(agentId);
    setAgent(fresh);
    return fresh;
  };

  const formatDate = (d) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col font-tahoma selection:bg-[#FCD86C] selection:text-[#111]">
      {/* Top Status Bar */}
      <div className="bg-[#1D3D7A] text-white/80 text-[10px] flex justify-between px-4 py-1.5 uppercase tracking-widest border-b-2 border-[#111] font-bold shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-20 relative">
        <span className="flex items-center gap-2">
          <span className="text-[12px]">🛂</span> AGENT PASSPORT OFFICE - IMMIGRATION SERVICES FOR AI AGENTS --- EST. 2006
        </span>
        <span>{formatDate(now)} • {formatTime(now)}</span>
      </div>

      <div className="flex-1 flex flex-col items-center py-8 px-4 relative z-10">
        
        {/* Main Logo Text */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="comic-title text-[56px] leading-none mb-1 drop-shadow-[4px_4px_0_rgba(17,17,17,1)] relative">
            <span className="absolute -left-12 top-1 text-5xl drop-shadow-[3px_3px_0_#111]">🛂</span>
            AgentPassport
          </h1>
          <p className="text-white text-[11px] font-bold uppercase tracking-[0.2em] drop-shadow-[2px_2px_0_#111]">
            Immigration Services for AI Agents — est. 2006
          </p>
        </div>

        <NavBar agentId={agentId} />

        {latestTxHash && (
          <div className="w-full max-w-2xl mt-4 p-3 bg-[#fdfaf0] border-[3px] border-[#111] text-[#111] text-xs font-bold rounded shadow-[4px_4px_0_rgba(0,0,0,0.4)] animate-bounce text-center">
            <span className="text-green-600 text-sm">✅ On-Chain Transaction Verified:</span><br />
            <span className="font-mono text-[10px] bg-[#F5EDB9] px-2 py-1 border border-[#111] mt-1 inline-block">{latestTxHash}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="w-full flex-1 flex justify-center relative max-w-6xl mt-4">
          <Routes>
            <Route
              path="/"
              element={
                <LandingPage
                  agent={agent}
                  onRegistered={(newAgent) => {
                    setAgentId(newAgent.id);
                    setAgent(newAgent);
                  }}
                />
              }
            />
            <Route
              path="/passport"
              element={agent ? <PassportPage agent={agent} /> : <Navigate to="/" />}
            />
            <Route
              path="/visa"
              element={agent ? <VisaPage agent={agent} /> : <Navigate to="/" />}
            />
            <Route
              path="/immigration"
              element={
                agent ? (
                  <ImmigrationPage agent={agent} onDone={refreshAgent} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/stamps"
              element={agent ? <StampsPage agent={agent} /> : <Navigate to="/" />}
            />
            <Route
              path="/trust"
              element={
                agent ? (
                  <TrustPage agent={agent} onUpdate={refreshAgent} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route path="/blacklist" element={<BlacklistPage />} />
          </Routes>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-[#FCD86C] border-t-[3px] border-[#111] p-3 flex flex-wrap justify-between items-center text-[10px] font-black text-[#111] uppercase px-8 shadow-[0_-2px_6px_rgba(0,0,0,0.5)] z-20 relative">
        <div className="flex items-center gap-3">
           <span className="text-2xl drop-shadow-[2px_2px_0_#111]">🔒</span>
           <div>
             <div>Secure Connection Established</div>
             <div className="font-bold opacity-80">128-Bit Encryption Active</div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-2xl drop-shadow-[2px_2px_0_#111]">👥</span>
           <div>
             <div>Visitors Today:</div>
             <div className="font-bold text-[#1D3D7A] text-[12px]">248</div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-2xl drop-shadow-[2px_2px_0_#111]">🌐</span>
           <div>
             <div>Agents Registered:</div>
             <div className="font-bold text-[#1D3D7A] text-[12px]">18,593</div>
           </div>
        </div>
        <div className="text-right">
           <div className="italic text-[#1D3D7A]">"Not every agent is human, but every agent counts."</div>
           <div className="font-bold opacity-80">- Agent Passport Office</div>
        </div>
      </div>
      
      {/* Absolute bottom copyright */}
      <div className="bg-[#1D3D7A] text-white/70 text-[9px] flex justify-between items-center px-4 py-2 uppercase border-t-2 border-[#111] font-bold z-20 relative">
         <div className="flex items-center gap-2">
           <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[12px] text-[#1D3D7A] font-serif italic border border-[#111]">e</div>
           <div>Best viewed in Internet Explorer 6.0+<br/>Resolution 1024 x 768</div>
         </div>
         <div className="text-center">
            © 2006 Republic of Agents. All rights reserved.<br/>
            This website is maintained by the Digital Immigration Division.
         </div>
         <div className="flex items-center gap-2">
            <div>Last Updated: 10 / 05 / 2006</div>
            <div className="bg-white text-[#111] px-1 py-0.5 border-2 border-[#111] font-black tracking-widest text-[10px]">W3C XHTML 1.0</div>
         </div>
      </div>
    </div>
  );
}
