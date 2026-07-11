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
      <p className="text-xs mb-3">
        Known malicious agents and creators are blocked from registration and visa approval
        automatically. This watchlist is checked by name and creator, case-insensitively.
      </p>

      <form onSubmit={handleSubmit} className="xp-panel p-3 mb-4 space-y-2 text-xs">
        <p className="font-bold text-xpblue-dark uppercase text-[10px]">Add Watchlist Entry</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="xp-input"
            placeholder="Agent name (optional)"
            value={form.agentName}
            onChange={(e) => setForm({ ...form, agentName: e.target.value })}
          />
          <input
            className="xp-input"
            placeholder="Creator (optional)"
            value={form.creator}
            onChange={(e) => setForm({ ...form, creator: e.target.value })}
          />
        </div>
        <input
          className="xp-input w-full"
          placeholder="Reason for blacklisting"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        {error && <p className="text-red-700">{error}</p>}
        {notice && <p className="text-green-700">{notice}</p>}
        <div className="flex justify-end">
          <button type="submit" className="xp-btn xp-btn-primary text-xs">
            🚫 Add to Blacklist
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center">
          <div className="xp-spinner" style={{ width: 20, height: 20, borderWidth: 3 }} />
          <span className="text-xs">Loading...</span>
        </div>
      ) : (
        <div className="xp-panel divide-y max-h-72 overflow-y-auto">
          {entries.length === 0 && (
            <p className="text-xs text-gray-400 italic p-3">No watchlist entries.</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="p-2 text-xs">
              <div className="flex justify-between">
                <p className="font-bold">
                  {e.agentName && <span>{e.agentName}</span>}
                  {e.agentName && e.creator && <span className="text-gray-400"> · </span>}
                  {e.creator && <span>{e.creator}</span>}
                </p>
                <p className="text-gray-400">{new Date(e.addedAt).toLocaleString()}</p>
              </div>
              <p className="text-gray-600">{e.reason}</p>
            </div>
          ))}
        </div>
      )}
    </XpWindow>
  );
}
