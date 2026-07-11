import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import XpWindow from "../components/XpWindow.jsx";
import { api } from "../lib/api.js";

export default function ImmigrationPage({ agent, onDone }) {
  const location = useLocation();
  const navigate = useNavigate();
  const website = location.state?.website;

  const [phase, setPhase] = useState("checking"); // checking | result
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!website) {
      navigate("/visa");
      return;
    }

    if (requestedRef.current) return;
    requestedRef.current = true;

    const minSpinnerMs = 1400;
    const start = Date.now();

    api
      .applyForVisa(agent.id, website)
      .then(async (res) => {
        const elapsed = Date.now() - start;
        const wait = Math.max(0, minSpinnerMs - elapsed);
        await new Promise((r) => setTimeout(r, wait));
        setResult(res);
        setPhase("result");
        onDone && onDone();
      })
      .catch((err) => {
        setError(err.message);
        setPhase("result");
      });
  }, [website, agent.id, onDone, navigate]);

  return (
    <XpWindow title="AgentPassport - Immigration Checkpoint" icon="👮">
      <div className="flex flex-col items-center justify-center py-12 text-center relative">
        {phase === "checking" && (
          <div className="flex flex-col items-center">
            <div className="xp-spinner mb-6" style={{ width: 48, height: 48, borderWidth: 6 }} />
            <p className="text-[16px] font-black text-[#1D3D7A] uppercase tracking-widest drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">
              Immigration Officer is reviewing your passport...
            </p>
            <p className="text-[12px] text-stone-600 mt-2 font-bold bg-[#F5EDB9] px-4 py-2 border-[2px] border-[#111] shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
              Checking identity, trust score, and entry requirements for <span className="text-[#111]">{website}</span>
            </p>
          </div>
        )}

        <AnimatePresence>
          {phase === "result" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
              className={`border-[4px] p-6 max-w-md w-full shadow-[6px_6px_0_rgba(0,0,0,0.5)] ${
                error 
                  ? "bg-[#fdf0f0] border-red-800" 
                  : result?.status === "approved" 
                  ? "bg-[#e6f4e6] border-green-800"
                  : "bg-[#fdf0f0] border-red-800"
              }`}
            >
              {error ? (
                <>
                  <p className="text-6xl drop-shadow-[2px_2px_0_#111]">⚠️</p>
                  <p className="font-black text-red-800 text-[24px] mt-4 uppercase tracking-widest drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">Error</p>
                  <p className="text-[12px] mt-2 font-bold text-red-900 border-t-[2px] border-red-800 pt-3">{error}</p>
                </>
              ) : result.status === "approved" ? (
                <>
                  <p className="text-6xl drop-shadow-[2px_2px_0_#111]">✅</p>
                  <p className="font-black text-green-800 text-[24px] mt-4 uppercase tracking-widest drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">Access Granted</p>
                  <p className="text-[12px] mt-2 font-bold text-green-900 border-t-[2px] border-green-800 pt-3">{result.reason}</p>
                </>
              ) : (
                <>
                  <p className="text-6xl drop-shadow-[2px_2px_0_#111]">❌</p>
                  <p className="font-black text-red-800 text-[24px] mt-4 uppercase tracking-widest drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">Access Denied</p>
                  <p className="text-[12px] mt-2 font-bold text-red-900 border-t-[2px] border-red-800 pt-3">{result.reason}</p>
                </>
              )}

              <div className="flex justify-center gap-3 mt-6 border-t-[2px] border-[#111]/20 pt-4">
                <button className="xp-btn text-[11px]" onClick={() => navigate("/visa")}>
                  Apply Elsewhere
                </button>
                <button
                  className="xp-btn xp-btn-primary text-[11px]"
                  onClick={() => navigate(result?.status === "approved" ? "/stamps" : "/trust")}
                >
                  {result?.status === "approved" ? "View Stamp →" : "View Trust Score →"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </XpWindow>
  );
}
