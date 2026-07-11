import { useState } from "react";
import { motion } from "framer-motion";
import XpWindow from "../components/XpWindow.jsx";
import { api } from "../lib/api.js";

const statusColors = {
  verified: "text-green-700 bg-green-100",
  pending: "text-yellow-700 bg-yellow-100",
  blacklisted: "text-red-700 bg-red-100",
};

function barColor(score) {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-400";
  return "bg-red-500";
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
      <div className="bg-[#F5EDB9] border-[2px] border-[#111] p-6 mb-6 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
        <div className="text-center mb-4">
          <p className="text-[12px] font-black text-stone-600 uppercase tracking-widest mb-1">Trust Score for {agent.name}</p>
          <p className="text-[56px] leading-none font-black text-[#1D3D7A] drop-shadow-[2px_2px_0_rgba(255,255,255,0.8)]">{agent.trustScore}</p>
          <div className="mt-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-[2px] border-[#111] ${statusColors[agent.verificationStatus]}`}>
              {agent.verificationStatus}
            </span>
          </div>
        </div>

        <div className="h-8 w-full bg-white border-[3px] border-[#111] mb-2 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] relative overflow-hidden">
          <motion.div
            className={`h-full border-r-[3px] border-[#111] ${barColor(agent.trustScore)}`}
            initial={{ width: 0 }}
            animate={{ width: `${agent.trustScore}%` }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          />
        </div>
      </div>

      <p className="text-[11px] mb-3 font-black text-[#111] uppercase tracking-widest">
        Simulate Behavior (dev demo controls)
      </p>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button className="xp-btn text-[11px] bg-gradient-to-b from-[#e6f4e6] to-[#c3e8c3]" disabled={busy} onClick={() => simulate(15, "Good behavior")}>
          👍 Simulate Good Behavior <strong className="text-green-700">(+15)</strong>
        </button>
        <button className="xp-btn text-[11px] bg-gradient-to-b from-[#fdf0f0] to-[#f9d6d6]" disabled={busy} onClick={() => simulate(-15, "Bad behavior")}>
          👎 Simulate Bad Behavior <strong className="text-red-700">(-15)</strong>
        </button>
        <button className="xp-btn text-[11px] bg-gradient-to-b from-[#fdf0f0] to-[#f5b8b8] border-red-800" disabled={busy} onClick={() => simulate(-50, "Malicious activity detected")}>
          🚨 Simulate Malicious Activity <strong className="text-red-800">(-50)</strong>
        </button>
      </div>

      {log.length > 0 && (
        <div className="mt-4 border-t-[2px] border-[#111] pt-4">
          <p className="text-[11px] mb-2 font-black text-[#1D3D7A] uppercase tracking-widest">Recent Changes</p>
          <div className="bg-white border-[2px] border-[#111] divide-y-[2px] divide-dashed divide-[#111] max-h-40 overflow-y-auto shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)] custom-scrollbar">
            {log.map((entry, i) => (
              <div key={i} className="p-3 text-[11px] flex justify-between items-center font-bold">
                <span className="text-[#111]">{entry.label}</span>
                <span className={`px-2 py-0.5 border-[2px] border-[#111] ${entry.delta >= 0 ? "bg-[#e6f4e6] text-green-800" : "bg-[#fdf0f0] text-red-800"}`}>
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
