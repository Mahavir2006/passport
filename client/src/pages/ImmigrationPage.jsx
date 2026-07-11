import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!website) {
      navigate("/visa");
      return;
    }

    let cancelled = false;
    const minSpinnerMs = 1400;
    const start = Date.now();

    api
      .applyForVisa(agent.id, website)
      .then(async (res) => {
        const elapsed = Date.now() - start;
        const wait = Math.max(0, minSpinnerMs - elapsed);
        await new Promise((r) => setTimeout(r, wait));
        if (cancelled) return;
        setResult(res);
        setPhase("result");
        onDone && onDone();
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setPhase("result");
      });

    return () => {
      cancelled = true;
    };
  }, [website]);

  return (
    <XpWindow title="AgentPassport - Immigration Checkpoint" icon="👮">
      <div className="flex flex-col items-center justify-center py-10 text-center">
        {phase === "checking" && (
          <>
            <div className="xp-spinner mb-4" />
            <p className="text-sm font-bold text-xpblue-dark">
              Immigration Officer is reviewing your passport...
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Checking identity, trust score, and entry requirements for {website}
            </p>
          </>
        )}

        <AnimatePresence>
          {phase === "result" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="xp-panel border-2 p-5 max-w-sm"
              style={{
                borderColor: error
                  ? "#b91c1c"
                  : result?.status === "approved"
                  ? "#15803d"
                  : "#b91c1c",
              }}
            >
              {error ? (
                <>
                  <p className="text-3xl">⚠️</p>
                  <p className="font-bold text-red-700 mt-2">Error</p>
                  <p className="text-xs mt-1">{error}</p>
                </>
              ) : result.status === "approved" ? (
                <>
                  <p className="text-3xl">✅</p>
                  <p className="font-bold text-green-700 mt-2">Access Granted</p>
                  <p className="text-xs mt-1">{result.reason}</p>
                </>
              ) : (
                <>
                  <p className="text-3xl">❌</p>
                  <p className="font-bold text-red-700 mt-2">Access Denied</p>
                  <p className="text-xs mt-1">{result.reason}</p>
                </>
              )}

              <div className="flex justify-center gap-2 mt-4">
                <button className="xp-btn" onClick={() => navigate("/visa")}>
                  Apply Elsewhere
                </button>
                <button
                  className="xp-btn xp-btn-primary"
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
