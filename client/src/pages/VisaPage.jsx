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
    <XpWindow title="AgentPassport - Visa Application" icon="🌐" wide={true}>
      
      {/* Custom URL visit bar */}
      <div className="bg-[#F5EDB9] p-4 mb-5 border-[3px] border-[#111] shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
        <p className="text-[12px] font-black uppercase text-[#1D3D7A] tracking-widest mb-3 drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">
          🔍 Send Agent to a URL
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            className="xp-input flex-1 font-mono font-bold text-[#111] text-[12px]"
            placeholder="Enter URL (e.g. https://example.com)"
            value={customUrl}
            onChange={(e) => { setCustomUrl(e.target.value); setReachStatus(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleVisit()}
          />
          <button
            className="xp-btn xp-btn-primary text-[11px] px-4"
            onClick={handleVisit}
            disabled={reachStatus === "checking"}
          >
            {reachStatus === "checking" ? "Visiting..." : "Visit →"}
          </button>
        </div>
        {reachStatus === "reached" && (
          <p className="text-[11px] text-green-800 font-black mt-3 bg-[#e6f4e6] border-[2px] border-green-800 p-2 shadow-[2px_2px_0_rgba(22,163,74,0.3)]">
            ✅ Agent reached {customUrl}
          </p>
        )}
        {reachStatus === "failed" && (
          <p className="text-[11px] text-red-800 font-black mt-3 bg-[#fdf0f0] border-[2px] border-red-800 p-2 shadow-[2px_2px_0_rgba(220,38,38,0.3)]">
            ❌ Agent could not reach {customUrl}
          </p>
        )}
      </div>

      <p className="text-xs mb-4 font-semibold text-[#111]">
        Select a destination website ("country") for <b className="text-[#1D3D7A]">{agent.name}</b> to visit. 
        Each site has its own entry requirements.
      </p>

      <div className="flex gap-6">
        <div className="flex-1 space-y-3">
          {websites.map((site) => (
            <label
              key={site.name}
              className={`xp-panel flex items-start gap-3 p-3 cursor-pointer ${
                selected === site.name ? "border-[3px] border-[#1D3D7A] bg-[#fdfaf0] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)]" : "border-[2px] border-[#111]"
              }`}
            >
              <input
                type="radio"
                name="website"
                className="mt-1 accent-[#111] w-3.5 h-3.5"
                checked={selected === site.name}
                onChange={() => setSelected(site.name)}
              />
              <div className="text-[11px] font-sans">
                <p className="font-black text-[13px] text-[#1D3D7A]">{site.name}</p>
                <p className="text-stone-800 font-semibold mb-1 leading-relaxed">{site.description}</p>
                <p className="text-stone-600 font-bold uppercase tracking-wider text-[9px]">
                  Category: {site.category} &middot; Min trust score: {site.minTrustScore}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Right column: Visa Tip */}
        <div className="w-48 hidden md:block border-[2px] border-dashed border-[#111] p-4 relative bg-[#F5EDB9]">
           <div className="absolute top-2 right-2 text-2xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">✈️</div>
           <h3 className="font-black text-[#111] text-[14px] mt-6 mb-2 tracking-widest">VISA TIP!</h3>
           <p className="text-[11px] font-bold text-stone-700 leading-relaxed">
             Higher trust score opens more destinations. Keep your agent behaving well to increase its score over time!
           </p>
           <div className="absolute bottom-2 right-2 text-3xl opacity-50 drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">🛳️</div>
        </div>
      </div>

      <div className="flex justify-end pt-5 border-t-[2px] border-[#111] mt-5">
        <button className="xp-btn xp-btn-primary" onClick={handleApply} disabled={!selected}>
          Apply for Visa →
        </button>
      </div>
    </XpWindow>
  );
}
