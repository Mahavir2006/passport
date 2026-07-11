import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import XpWindow from "../components/XpWindow.jsx";

const statusColors = {
  verified: "bg-green-600",
  pending: "bg-yellow-500",
  blacklisted: "bg-red-700",
};

export default function PassportPage({ agent }) {
  const navigate = useNavigate();

  return (
    <XpWindow title="AgentPassport - Digital Passport" icon="🛂">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="xp-panel p-4 border-2 border-xpblue-dark bg-gradient-to-br from-blue-50 to-white"
      >
        <div className="flex justify-between items-start border-b-2 border-xpblue-dark pb-2 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-xpblue-dark font-bold">
              AI Agent Passport
            </p>
            <p className="text-lg font-bold text-xpblue-dark">{agent.name}</p>
          </div>
          <span
            className={`text-white text-[10px] font-bold px-2 py-1 rounded uppercase ${
              statusColors[agent.verificationStatus] || "bg-gray-500"
            }`}
          >
            {agent.verificationStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Field label="Passport ID" value={agent.id} />
          <Field label="Creator" value={agent.creator} />
          <Field label="Risk Level" value={agent.riskLevel} />
          <Field label="Trust Score" value={`${agent.trustScore} / 100`} />
          <Field label="Spending Limit" value={`$${agent.spendingLimit}`} />
          <Field label="Issued" value={new Date(agent.createdAt).toLocaleString()} />
        </div>

        <div className="mt-3">
          <p className="text-[10px] uppercase font-bold text-xpblue-dark">Purpose</p>
          <p className="text-xs italic">{agent.purpose}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-xpblue-dark">Requested Permissions</p>
            <ul className="text-xs list-disc list-inside">
              {agent.requestedPermissions.length ? (
                agent.requestedPermissions.map((p) => <li key={p}>{p}</li>)
              ) : (
                <li className="italic text-gray-400">none</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-xpblue-dark">Granted Permissions</p>
            <ul className="text-xs list-disc list-inside">
              {agent.grantedPermissions.length ? (
                agent.grantedPermissions.map((p) => <li key={p}>{p}</li>)
              ) : (
                <li className="italic text-gray-400">none</li>
              )}
            </ul>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-end pt-4">
        <button className="xp-btn xp-btn-primary" onClick={() => navigate("/visa")}>
          Apply for Visa →
        </button>
      </div>
    </XpWindow>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold text-xpblue-dark">{label}</p>
      <p>{value}</p>
    </div>
  );
}
