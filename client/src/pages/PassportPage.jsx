import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import XpWindow from "../components/XpWindow.jsx";

const statusColors = {
  verified: "bg-green-600 border-[#111]",
  pending: "bg-yellow-500 border-[#111]",
  blacklisted: "bg-red-700 border-[#111]",
};

export default function PassportPage({ agent }) {
  const navigate = useNavigate();

  return (
    <XpWindow title="AgentPassport - Digital Passport" icon="" wide={true}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="xp-panel p-5 border-[3px] border-[#111] bg-[#F5EDB9]"
      >
        <div className="flex justify-between items-start border-b-[3px] border-[#111] pb-3 mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#1D3D7A] font-black drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">
              AI Agent Passport
            </p>
            <p className="text-3xl font-black text-[#111] leading-none mt-1">{agent.name}</p>
          </div>
          <span
            className={`text-white text-[12px] font-black px-3 py-1.5 rounded-sm uppercase tracking-widest border-[2px] shadow-[2px_2px_0_rgba(0,0,0,0.4)] ${
              statusColors[agent.verificationStatus] || "bg-gray-500 border-[#111]"
            }`}
          >
            {agent.verificationStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-sans">
          <Field label="Passport ID" value={agent.id} font="mono" />
          <Field label="Creator" value={agent.creator} />
          <Field label="Risk Level" value={agent.riskLevel} />
          <Field label="Trust Score" value={`${agent.trustScore} / 100`} />
          <Field label="Spending Limit" value={`$${agent.spendingLimit}`} />
          <Field label="Issued" value={new Date(agent.createdAt).toLocaleString()} />
        </div>

        <div className="mt-5 p-3 bg-[#fdfaf0] border-[2px] border-[#111] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
          <p className="text-[10px] uppercase font-black text-stone-500 mb-1 tracking-widest">Purpose</p>
          <p className="text-sm font-semibold text-[#111]">{agent.purpose}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="p-3 bg-white border-[2px] border-[#111] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
            <p className="text-[10px] uppercase font-black text-stone-500 mb-2 tracking-widest">Requested Permissions</p>
            <ul className="text-xs font-bold text-[#111] space-y-1">
              {agent.requestedPermissions.length ? (
                agent.requestedPermissions.map((p) => (
                  <li key={p} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#111] rounded-full inline-block"></span> {p}
                  </li>
                ))
              ) : (
                <li className="italic text-gray-400">none</li>
              )}
            </ul>
          </div>
          <div className="p-3 bg-white border-[2px] border-[#111] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
            <p className="text-[10px] uppercase font-black text-stone-500 mb-2 tracking-widest">Granted Permissions</p>
            <ul className="text-xs font-bold text-[#111] space-y-1">
              {agent.grantedPermissions.length ? (
                agent.grantedPermissions.map((p) => (
                  <li key={p} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#111] rounded-full inline-block"></span> {p}
                  </li>
                ))
              ) : (
                <li className="italic text-gray-400">none</li>
              )}
            </ul>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-end pt-5">
        <button className="xp-btn xp-btn-primary" onClick={() => navigate("/visa")}>
          Apply for Visa →
        </button>
      </div>
    </XpWindow>
  );
}

function Field({ label, value, font = "sans" }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-black text-stone-500 tracking-widest">{label}</p>
      <p className={`font-bold text-[#111] text-sm ${font === "mono" ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
