import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import XpWindow from "../components/XpWindow.jsx";
import { api } from "../lib/api.js";

export default function VisaPage({ agent }) {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [selected, setSelected] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [reachStatus, setReachStatus] = useState(null); // null | "checking" | "reached" | "failed"

  // Dispatch / real-agent task state
  const [dispatchUrl, setDispatchUrl]         = useState("http://localhost:4001");
  const [loginPagePath, setLoginPagePath]     = useState("");
  const [useCredLogin, setUseCredLogin]       = useState(false);
  const [dispatching, setDispatching]         = useState(false);
  const [visaEvent, setVisaEvent]             = useState(null);
  const [taskEvent, setTaskEvent]             = useState(null);

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
      setReachStatus(data.reached ? { ok: true, message: data.cartMessage } : { ok: false, message: data.error });
    } catch {
      setReachStatus({ ok: false, message: "Could not connect to server." });
    }
  };

  const handleDispatch = async () => {
    if (!dispatchUrl.trim()) return;
    setDispatching(true);
    setVisaEvent(null);
    setTaskEvent(null);

    try {
      const body = { targetUrl: dispatchUrl.trim() };
      // If credential-login mode is on, pass the login page path
      // (selectors use sensible defaults in agent-runner, no need to expose them in UI)
      if (useCredLogin && loginPagePath.trim()) {
        body.loginPagePath = loginPagePath.trim();
      }

      const { dispatchSessionId } = await api.dispatchAgentTask(agent.id, body);

      // Connect Socket.io and join the session room for live updates
      const socket = io("http://localhost:4000", { transports: ["websocket"] });
      socket.emit("join", dispatchSessionId);

      socket.on("visa_status", (data) => {
        setVisaEvent(data);
        if (data.status === "denied") { setDispatching(false); socket.disconnect(); }
      });

      socket.on("task_status", (data) => {
        setTaskEvent(data);
        if (data.status === "success" || data.status === "failed") {
          setDispatching(false);
          socket.disconnect();
        }
      });

      // Safety timeout — stop spinning after 30 s
      setTimeout(() => { setDispatching(false); socket.disconnect(); }, 30000);
    } catch (err) {
      setTaskEvent({ status: "failed", error: err.message });
      setDispatching(false);
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
          </button>        </div>
        {reachStatus && reachStatus !== "checking" && reachStatus.ok && (
          <p className="text-[11px] text-green-800 font-black mt-3 bg-[#e6f4e6] border-[2px] border-green-800 p-2 shadow-[2px_2px_0_rgba(22,163,74,0.3)]">
            🛒 {reachStatus.message}
          </p>
        )}
        {reachStatus && reachStatus !== "checking" && !reachStatus.ok && (
          <p className="text-[11px] text-red-800 font-black mt-3 bg-[#fdf0f0] border-[2px] border-red-800 p-2 shadow-[2px_2px_0_rgba(220,38,38,0.3)]">
            ❌ {reachStatus.message}
          </p>
        )}
      </div>

      {/* Real agent dispatch — Playwright task with live Socket.io updates */}
      <div className="bg-[#fdfaf0] p-4 mb-5 border-[3px] border-[#1D3D7A] shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
        <p className="text-[12px] font-black uppercase text-[#1D3D7A] tracking-widest mb-3">
          🤖 Dispatch Real Agent Task (Playwright)
        </p>

        {/* Target URL */}
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            className="xp-input flex-1 font-mono font-bold text-[#111] text-[12px]"
            placeholder="Target site URL (e.g. https://rift-ecommerce.vercel.app)"
            value={dispatchUrl}
            onChange={(e) => setDispatchUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !dispatching && handleDispatch()}
          />
          <button
            className="xp-btn xp-btn-primary text-[11px] px-4"
            onClick={handleDispatch}
            disabled={dispatching}
          >
            {dispatching ? "Running..." : "Launch Agent →"}
          </button>
        </div>

        {/* Login mode toggle */}
        <div className="flex items-center gap-3 mb-2">
          <label className="flex items-center gap-2 text-[11px] font-bold text-[#111] cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-[#111] w-3.5 h-3.5"
              checked={useCredLogin}
              onChange={(e) => setUseCredLogin(e.target.checked)}
            />
            Use credential login (agent types username + password into the site's login form)
          </label>
        </div>

        {/* Credential login path — only shown when toggled on */}
        {useCredLogin && (
          <div className="bg-[#F5EDB9] border-[2px] border-[#111] p-3 mb-3 text-[11px]">
            <p className="font-black text-[#1D3D7A] uppercase tracking-widest mb-2">
              🔐 Login page path on the target site
            </p>
            <div className="flex gap-2 items-center">
              <span className="font-mono text-[#111] opacity-60">{dispatchUrl || "https://site.com"}</span>
              <input
                type="text"
                className="xp-input font-mono font-bold text-[#111] text-[11px]"
                style={{ width: 140 }}
                placeholder="/login"
                value={loginPagePath}
                onChange={(e) => setLoginPagePath(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-stone-600 font-semibold mt-2">
              The agent will fill the username and password (linked to this passport) into standard
              <code className="bg-white border border-stone-300 px-1 mx-0.5">input[type="email"]</code> /
              <code className="bg-white border border-stone-300 px-1 mx-0.5">input[type="password"]</code>
              fields and click the submit button. Make sure credentials are linked via registration.
            </p>
          </div>
        )}

        {/* Live status feed */}
        {(visaEvent || taskEvent || dispatching) && (
          <div className="space-y-2 text-[11px] font-bold border-t-[2px] border-[#111] pt-3">
            {dispatching && !visaEvent && (
              <p className="text-[#1D3D7A]">⏳ Waiting for visa check...</p>
            )}
            {visaEvent && (
              <p className={visaEvent.status === "approved" ? "text-green-800" : visaEvent.status === "denied" ? "text-red-800" : "text-[#1D3D7A]"}>
                {visaEvent.status === "pending"  && "⏳ Visa check pending..."}
                {visaEvent.status === "approved" && "✅ Visa approved — agent entering site"}
                {visaEvent.status === "denied"   && `❌ Visa denied: ${visaEvent.reason}`}
              </p>
            )}
            {taskEvent && (
              <p className={taskEvent.status === "success" ? "text-green-800" : taskEvent.status === "failed" ? "text-red-800" : "text-[#1D3D7A]"}>
                {taskEvent.status === "in_progress" && "🔄 Agent is browsing the shop..."}
                {taskEvent.status === "success"     && `🛒 Task complete — added "${taskEvent.item}" ($${taskEvent.price}) to cart`}
                {taskEvent.status === "failed"      && `💥 Task failed: ${taskEvent.error}`}
              </p>
            )}
          </div>
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
