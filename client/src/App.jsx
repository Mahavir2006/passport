import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
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

  useEffect(() => {
    if (agentId) {
      localStorage.setItem("agentId", agentId);
      api.getAgent(agentId).then(setAgent).catch(() => {});
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

      <Routes>
        <Route
          path="/"
          element={
            <RegisterPage
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
