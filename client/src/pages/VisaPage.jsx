import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import XpWindow from "../components/XpWindow.jsx";
import { api } from "../lib/api.js";

export default function VisaPage({ agent }) {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [selected, setSelected] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [reachStatus, setReachStatus] = useState(null); // null | "checking" | "reached" | "failed"

  useEffect(() => {
    api.listWebsites().then((sites) => {
      setWebsites(sites);
      if (sites.length) setSelected(sites[0].name);
    });
  }, []);

  const handleApply = () => {
    navigate("/immigration", { state: { website: selected } });
  };

  const handleVisit = async () => {
    if (!customUrl.trim()) return;
    setReachStatus("checking");
    try {
      const res = await fetch("/api/agents/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: customUrl.trim(), agentId: agent.id }),
      });
      const data = await res.json();
      setReachStatus(data.reached ? "reached" : "failed");
    } catch {
      setReachStatus("failed");
    }
  };

  return (
    <XpWindow title="AgentPassport - Visa Application" icon="🌐">
      {/* Custom URL visit bar */}
      <div className="xp-panel p-3 mb-4 border border-xpblue-dark">
        <p className="text-xs font-bold text-xpblue-dark mb-2">🔍 Send Agent to a URL</p>
        <div className="flex gap-2">
          <input
            type="text"
            className="xp-input flex-1 text-xs px-2 py-1 border border-gray-400 rounded font-mono"
            placeholder="Enter URL (e.g. https://example.com)"
            value={customUrl}
            onChange={(e) => { setCustomUrl(e.target.value); setReachStatus(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleVisit()}
          />
          <button
            className="xp-btn xp-btn-primary text-xs px-3"
            onClick={handleVisit}
            disabled={reachStatus === "checking"}
          >
            {reachStatus === "checking" ? "Visiting..." : "Visit →"}
          </button>
        </div>
        {reachStatus === "reached" && (
          <p className="text-xs text-green-700 font-bold mt-2">✅ Agent reached {customUrl}</p>
        )}
        {reachStatus === "failed" && (
          <p className="text-xs text-red-700 font-bold mt-2">❌ Agent could not reach {customUrl}</p>
        )}
      </div>

      <p className="text-xs mb-3">
        Select a destination website ("country") for <b>{agent.name}</b> to visit. Each site has
        its own entry requirements.
      </p>

      <div className="space-y-2">
        {websites.map((site) => (
          <label
            key={site.name}
            className={`xp-panel flex items-start gap-3 p-3 cursor-pointer ${selected === site.name ? "border-2 border-xpblue-dark" : ""
              }`}
          >
            <input
              type="radio"
              name="website"
              className="mt-1"
              checked={selected === site.name}
              onChange={() => setSelected(site.name)}
            />
            <div className="text-xs">
              <p className="font-bold text-xpblue-dark">{site.name}</p>
              <p className="text-gray-600">{site.description}</p>
              <p className="text-gray-500 mt-1">
                Category: {site.category} &middot; Min trust score: {site.minTrustScore}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button className="xp-btn xp-btn-primary" onClick={handleApply} disabled={!selected}>
          Apply for Visa →
        </button>
      </div>
    </XpWindow>
  );
}
