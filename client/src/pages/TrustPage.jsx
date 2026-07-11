import { useState } from "react";
import { motion } from "framer-motion";
import XpWindow from "../components/XpWindow.jsx";
import { api } from "../lib/api.js";

const statusColors = {
  verified: "text-green-700",
  pending: "text-yellow-700",
  blacklisted: "text-red-700",
};

function barColor(score) {
  if (score >= 70) return "bg-green-600";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-600";
}

export default function TrustPage({ agent, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const simulate = async (delta, label) => {
    setBusy(true);
    try {
      const updated = await onUpdate();
      const newAgent = await api.simulateBehavior(agent.id, delta);
      setLog((prev) => [
        { label, delta, before: updated?.trustScore ?? agent.trustScore, after: newAgent.trustScore, at: new Date() },
        ...prev,
      ]);
      await onUpdate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <XpWindow title="AgentPassport - Trust Score Dashboard" icon="📊">
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500">Trust Score for {agent.name}</p>
        <p className="text-4xl font-bold text-xpblue-dark">{agent.trustScore}</p>
        <p className={`text-xs font-bold uppercase ${statusColors[agent.verificationStatus]}`}>
          {agent.verificationStatus}
        </p>
      </div>

      <div className="xp-panel h-6 w-full overflow-hidden border border-gray-400 mb-4">
        <motion.div
          className={`h-full ${barColor(agent.trustScore)}`}
          initial={{ width: 0 }}
          animate={{ width: `${agent.trustScore}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <p className="text-xs mb-2 font-bold text-xpblue-dark uppercase">
        Simulate Behavior (dev demo controls)
      </p>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button className="xp-btn text-xs" disabled={busy} onClick={() => simulate(15, "Good behavior")}>
          👍 Simulate Good Behavior (+15)
        </button>
        <button className="xp-btn text-xs" disabled={busy} onClick={() => simulate(-15, "Bad behavior")}>
          👎 Simulate Bad Behavior (-15)
        </button>
        <button className="xp-btn text-xs" disabled={busy} onClick={() => simulate(-50, "Malicious activity detected")}>
          🚨 Simulate Malicious Activity (-50)
        </button>
      </div>

      {log.length > 0 && (
        <div>
          <p className="text-xs mb-1 font-bold text-xpblue-dark uppercase">Recent Changes</p>
          <div className="xp-panel divide-y max-h-40 overflow-y-auto">
            {log.map((entry, i) => (
              <div key={i} className="p-2 text-xs flex justify-between">
                <span>{entry.label}</span>
                <span className={entry.delta >= 0 ? "text-green-700" : "text-red-700"}>
                  {entry.before} → {entry.after}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </XpWindow>
  );
}
