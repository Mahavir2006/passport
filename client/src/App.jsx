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

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <h1 className="text-white text-2xl font-bold mb-1 drop-shadow-md">
        🛂 AgentPassport
      </h1>
      <p className="text-white/80 text-xs mb-4">Immigration Services for AI Agents — est. 2006</p>

      <NavBar agentId={agentId} />

      {latestTxHash && (
        <div className="w-full max-w-md mt-2 p-2 bg-green-900 border border-green-500 text-green-100 text-xs rounded mb-4 break-all shadow-[0_0_10px_rgba(34,197,94,0.3)] animate-pulse">
          <strong>✅ On-Chain Transaction Verified:</strong><br />
          <span className="font-mono text-[10px] opacity-80">{latestTxHash}</span>
        </div>
      )}

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
  );
}
