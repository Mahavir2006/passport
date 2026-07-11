import { useEffect, useState } from "react";
import XpWindow from "../components/XpWindow.jsx";
import { api } from "../lib/api.js";

export default function BlacklistPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ agentName: "", creator: "", reason: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = () => {
    setLoading(true);
    api.listBlacklist().then((rows) => {
      setEntries(rows);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!form.reason || (!form.agentName && !form.creator)) {
      setError("Provide a reason, and at least an agent name or creator.");
      return;
    }
    try {
      const res = await api.addBlacklistEntry(form);
      setForm({ agentName: "", creator: "", reason: "" });
      setNotice(
        res.flaggedAgentIds.length
          ? `Added. ${res.flaggedAgentIds.length} existing agent(s) retroactively blacklisted.`
          : "Added to blacklist database."
      );
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <XpWindow title="AgentPassport - Blacklist Database (Immigration Watchlist)" icon="🚫" wide>
      <p className="text-[11px] mb-4 font-bold text-stone-700 leading-relaxed">
        Known malicious agents and creators are blocked from registration and visa approval
        automatically. This watchlist is checked by name and creator, case-insensitively.
      </p>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <form onSubmit={handleSubmit} className="flex-1 bg-[#F5EDB9] border-[3px] border-[#111] p-5 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
          <p className="font-black text-[#1D3D7A] uppercase text-[14px] mb-3 tracking-widest drop-shadow-[1px_1px_0_rgba(255,255,255,1)]">
            Add Watchlist Entry
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              className="xp-input font-bold text-[#111]"
              placeholder="Agent name (optional)"
              value={form.agentName}
              onChange={(e) => setForm({ ...form, agentName: e.target.value })}
            />
            <input
              className="xp-input font-bold text-[#111]"
              placeholder="Creator (optional)"
              value={form.creator}
              onChange={(e) => setForm({ ...form, creator: e.target.value })}
            />
          </div>
          <input
            className="xp-input w-full font-bold text-[#111] mb-3"
            placeholder="Reason for blacklisting"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
          {error && <p className="bg-red-100 border-[2px] border-red-600 text-red-800 text-[10px] p-2 font-bold mb-3 shadow-[2px_2px_0_rgba(220,38,38,0.3)]">{error}</p>}
          {notice && <p className="bg-green-100 border-[2px] border-green-600 text-green-800 text-[10px] p-2 font-bold mb-3 shadow-[2px_2px_0_rgba(22,163,74,0.3)]">{notice}</p>}
          <div className="flex justify-end pt-2 border-t-[2px] border-[#111]">
            <button type="submit" className="xp-btn text-[11px] bg-gradient-to-b from-[#fdf0f0] to-[#f9d6d6] border-red-800 text-red-900 hover:from-[#ffffff] hover:to-[#f5b8b8]">
              ⛔ Add to Blacklist
            </button>
          </div>
        </form>

        {/* Wanted Poster styling (without avatar) */}
        <div className="hidden md:flex w-48 bg-[#D2C8A8] border-[3px] border-[#111] p-3 flex-col items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,0.4)] rotate-2">
           <h2 className="text-[28px] font-serif font-black text-[#111] tracking-tighter mb-2 border-b-[3px] border-[#111] w-full text-center pb-1">WANTED</h2>
           <div className="w-24 h-24 bg-[#E8E1CC] border-[3px] border-[#111] mb-2 flex items-center justify-center shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)]">
              <span className="text-5xl drop-shadow-[2px_2px_0_#111]">⚠️</span>
           </div>
           <p className="text-[14px] font-black uppercase text-red-800 tracking-widest text-center leading-tight">Malicious<br/>Agent</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center">
          <div className="xp-spinner" />
          <span className="text-[12px] font-bold">Loading database...</span>
        </div>
      ) : (
        <div className="bg-white border-[3px] border-[#111] divide-y-[2px] divide-dashed divide-[#111] max-h-72 overflow-y-auto shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)] custom-scrollbar">
          {entries.length === 0 && (
            <p className="text-[11px] text-stone-500 italic p-4 text-center font-bold">No watchlist entries.</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="p-3 text-[11px] hover:bg-[#F5EDB9] transition-colors">
              <div className="flex justify-between items-center mb-1">
                <p className="font-black text-[#111] text-[13px] uppercase">
                  {e.agentName && <span className="text-red-700">{e.agentName}</span>}
                  {e.agentName && e.creator && <span className="text-stone-400 mx-1">/</span>}
                  {e.creator && <span className="text-[#1D3D7A]">{e.creator}</span>}
                </p>
                <p className="text-stone-500 font-bold opacity-80">{new Date(e.addedAt).toLocaleString()}</p>
              </div>
              <p className="text-stone-700 font-semibold">{e.reason}</p>
            </div>
          ))}
        </div>
      )}
    </XpWindow>
  );
}
