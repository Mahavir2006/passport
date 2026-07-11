import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import XpWindow from "../components/XpWindow.jsx";
import { api } from "../lib/api.js";

export default function StampsPage({ agent }) {
  const navigate = useNavigate();
  const [data, setData] = useState({ stamps: [], visas: [] });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getStamps(agent.id).then((res) => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(load, [agent.id]);

  return (
    <XpWindow title="AgentPassport - Passport Stamps & Activity Log" icon="📖" wide>
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs">
          Activity history for <b>{agent.name}</b> ({agent.id})
        </p>
        <button className="xp-btn text-xs" onClick={load}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center">
          <div className="xp-spinner" style={{ width: 20, height: 20, borderWidth: 3 }} />
          <span className="text-xs">Loading...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold text-xpblue-dark text-xs uppercase mb-2">
              Stamps ({data.stamps.length})
            </p>
            <div className="xp-panel divide-y max-h-72 overflow-y-auto">
              {data.stamps.length === 0 && (
                <p className="text-xs text-gray-400 italic p-3">No stamps yet — apply for a visa!</p>
              )}
              {data.stamps.map((s) => (
                <div key={s.id} className="p-2 text-xs flex justify-between">
                  <div>
                    <p className="font-bold">{s.website}</p>
                    <p className="text-gray-500">{s.action}</p>
                  </div>
                  <p className="text-gray-400">{new Date(s.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-bold text-xpblue-dark text-xs uppercase mb-2">
              Visa History ({data.visas.length})
            </p>
            <div className="xp-panel divide-y max-h-72 overflow-y-auto">
              {data.visas.length === 0 && (
                <p className="text-xs text-gray-400 italic p-3">No visa applications yet.</p>
              )}
              {data.visas.map((v) => (
                <div key={v.id} className="p-2 text-xs">
                  <div className="flex justify-between">
                    <p className="font-bold">{v.website}</p>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-white ${
                        v.status === "approved" ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <p className="text-gray-500">{v.reason}</p>
                  <p className="text-gray-400">{new Date(v.issuedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <button className="xp-btn" onClick={() => navigate("/visa")}>
          Apply for Another Visa
        </button>
        <button className="xp-btn xp-btn-primary" onClick={() => navigate("/trust")}>
          View Trust Score →
        </button>
      </div>
    </XpWindow>
  );
}
