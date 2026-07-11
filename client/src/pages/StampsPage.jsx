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
      <div className="flex justify-between items-center mb-5 bg-[#F5EDB9] p-3 border-[2px] border-[#111] shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
        <p className="text-[12px] font-sans">
          Activity history for <b className="text-[#1D3D7A] font-black">{agent.name}</b> ({agent.id})
        </p>
        <button className="xp-btn text-[11px] py-1 px-3" onClick={load}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 justify-center">
          <div className="xp-spinner" />
          <span className="text-[12px] font-bold text-[#111]">Loading records...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="font-black text-[#111] text-[12px] uppercase mb-2 tracking-widest bg-[#BFA8EA] p-1.5 border-[2px] border-[#111] shadow-[2px_2px_0_#111] text-center">
              Stamps ({data.stamps.length})
            </p>
            <div className="bg-[#fdfaf0] border-[2px] border-[#111] divide-y-[2px] divide-dashed divide-[#111] max-h-72 overflow-y-auto shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)] custom-scrollbar">
              {data.stamps.length === 0 && (
                <p className="text-[11px] text-stone-500 font-bold italic p-4 text-center">No stamps yet — apply for a visa!</p>
              )}
              {data.stamps.map((s) => (
                <div key={s.id} className="p-3 text-[11px] flex justify-between items-center hover:bg-white transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl drop-shadow-[1px_1px_0_#111]">🛂</span>
                    <div>
                      <p className="font-black text-[#1D3D7A] text-[13px]">{s.website}</p>
                      <p className="text-stone-600 font-bold">{s.action}</p>
                    </div>
                  </div>
                  <p className="text-stone-500 font-bold opacity-80">{new Date(s.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-black text-[#111] text-[12px] uppercase mb-2 tracking-widest bg-[#FCD86C] p-1.5 border-[2px] border-[#111] shadow-[2px_2px_0_#111] text-center">
              Visa History ({data.visas.length})
            </p>
            <div className="bg-[#fdfaf0] border-[2px] border-[#111] divide-y-[2px] divide-dashed divide-[#111] max-h-72 overflow-y-auto shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)] custom-scrollbar">
              {data.visas.length === 0 && (
                <p className="text-[11px] text-stone-500 font-bold italic p-4 text-center">No visa applications yet.</p>
              )}
              {data.visas.map((v) => (
                <div key={v.id} className="p-3 text-[11px] hover:bg-white transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-black text-[#1D3D7A] text-[13px]">{v.website}</p>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 border-[2px] border-[#111] text-white shadow-[1px_1px_0_rgba(0,0,0,0.5)] ${
                        v.status === "approved" ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <p className="text-stone-700 font-semibold mb-1 leading-relaxed">{v.reason}</p>
                  <p className="text-stone-500 font-bold opacity-80">{new Date(v.issuedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-5 mt-4 border-t-[2px] border-[#111]">
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
