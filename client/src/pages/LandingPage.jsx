import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

const PERMISSION_OPTIONS = [
  { id: "browse_web", label: "Browse the Web" },
  { id: "make_payments", label: "Make Payments" },
  { id: "post_content", label: "Post Content" },
  { id: "read_data", label: "Read Data" },
  { id: "delete_data", label: "Delete Data" },
  { id: "add_to_cart", label: "Add to Cart" },
];

export default function LandingPage({ agent, onRegistered }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", creator: "", purpose: "" });
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [regMode, setRegMode] = useState("url"); // "url" | "manual"
  const [agentUrl, setAgentUrl] = useState("http://localhost:4001/metadata");

  const togglePermission = (id) => {
    setPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleManualSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    if (!form.name || !form.creator || !form.purpose) {
      setError("Please fill in all fields before applying.");
      return;
    }
    setLoading(true);
    try {
      const { agent: newAgent } = await api.registerAgent({
        ...form,
        requestedPermissions: permissions,
      });
      onRegistered(newAgent);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    if (!agentUrl.trim()) {
      setError("Please provide an Agent URL.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/agents/register-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: agentUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to register via URL.");

      onRegistered(data.agent);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-between items-start gap-8 h-full pt-4">
      {/* Left Sticky Note */}
      <div className="hidden lg:block w-52 mt-8 sticky-note z-10 font-sans">
        <div className="pin"></div>
        <h3 className="font-black text-[13px] flex items-center gap-1.5 mb-3 text-[#1D3D7A] uppercase tracking-wide">
          <span className="text-lg">📢</span> WELCOME!
        </h3>
        <p className="text-[12px] leading-relaxed text-[#111] font-semibold">
          Welcome to the Agent Passport Office.<br /><br />
          Click the passport to flip it open. Complete your details on-chain to register your agent.
        </p>
      </div>

      {/* Center Passport */}
      <div className="flex-1 flex justify-center">
        <div className="passport-perspective py-6 relative z-20">
          <div
            className={`passport-container cursor-pointer ${isOpen ? "open" : ""}`}
            onClick={() => !isOpen && setIsOpen(true)}
          >
            <div className="passport-book">
              {/* Flipping Leaf (Front Cover + Left Inner Page back-to-back) */}
              <div className="passport-leaf passport-flip-leaf">
                {/* Front Cover Face */}
                <div className="passport-page-face passport-cover-front flex flex-col items-center justify-between py-12 px-6 text-center select-none shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                  {/* Top Text */}
                  <div className="space-y-1 mt-2">
                    <h2 className="gold-foil font-bold tracking-[0.3em] text-[18px] uppercase font-serif drop-shadow-md">
                      Republic of Agents
                    </h2>
                    <h3 className="gold-foil text-[12px] tracking-widest opacity-90 font-bold">
                      एजेंट गणराज्य
                    </h3>
                  </div>

                  {/* Custom AI/Indian National Emblem Gold SVG */}
                  <div className="w-32 h-32 my-6 flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="26" fill="none" stroke="url(#goldGrad)" strokeWidth="3" strokeDasharray="4 2" />
                      <circle cx="50" cy="50" r="14" fill="none" stroke="url(#goldGrad)" strokeWidth="2" />
                      <path d="M50,4 L50,24 M50,76 L50,96 M4,50 L24,50 M76,50 L96,50 M18,18 L32,32 M68,68 L82,82 M18,82 L32,68 M68,32 L82,18" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="50" cy="50" r="6" fill="url(#goldGrad)" />
                      <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#bf953f" />
                          <stop offset="25%" stopColor="#fcf6ba" />
                          <stop offset="50%" stopColor="#b38728" />
                          <stop offset="75%" stopColor="#fbf5b7" />
                          <stop offset="100%" stopColor="#aa771c" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Bottom Text */}
                  <div className="space-y-1 mb-4">
                    <h1 className="gold-foil font-bold text-3xl tracking-[0.3em] uppercase font-serif drop-shadow-md">
                      Passport
                    </h1>
                    <h3 className="gold-foil text-sm tracking-widest opacity-90 font-bold">
                      पासपोर्ट
                    </h3>
                    <div className="w-8 h-6 border-2 border-[#d4af37] mx-auto mt-4 rounded-sm flex items-center justify-center opacity-80">
                      <div className="w-3 h-3 bg-[#d4af37] rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Left Page Face (Guidelines & Signature) */}
                <div className="passport-page-face passport-page-left passport-watermark p-8 flex flex-col justify-between text-xs text-stone-800 font-serif">
                  <div className="space-y-6">
                    <div className="border-b-2 border-stone-400 pb-2 text-center">
                      <span className="font-bold tracking-wider text-[12px] uppercase">
                        Government of AI Authority
                      </span>
                    </div>
                    <p className="leading-relaxed text-[12px] text-justify">
                      These are to request and require in the Name of the Sovereign authority of AI Agents to allow the bearer to pass freely without let or hindrance, and to afford the bearer every assistance and protection of which he stands in need.
                    </p>
                  </div>

                  {/* Signature Area */}
                  <div className="mt-8 text-center space-y-2 relative">
                    {/* Stamp */}
                    <div className="absolute -left-2 -top-12 opacity-20 transform -rotate-12 pointer-events-none">
                      <div className="w-24 h-24 rounded-full border-[3px] border-blue-800 flex items-center justify-center">
                        <div className="text-center text-blue-800 font-black text-[9px] uppercase tracking-widest">
                          Official<br />Immigration<br />Seal
                        </div>
                      </div>
                    </div>
                    <div className="font-mono italic text-[#2563eb] text-lg transform -rotate-6 select-none opacity-80">
                      Immigration Officer
                    </div>
                    <div className="border-t border-stone-400 pt-1 text-[9px] uppercase tracking-wider text-stone-600">
                      Signature of Issuing Authority
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Inner Page (Registration Form / Details Page) */}
              <div
                className="passport-page-right passport-watermark p-6 flex flex-col justify-between font-sans text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {agent ? (
                  // Case A: Agent already registered - Show Booklet Details Page
                  <div className="h-full flex flex-col justify-between py-2">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b-[2px] border-[#111] pb-1.5">
                        <span className="font-bold text-[11px] uppercase tracking-widest text-[#111]">
                          AI Passport / ए.आई. पासपोर्ट
                        </span>
                        <span className="font-black text-red-600 text-[12px] bg-red-100 px-1 border border-red-200">
                          {agent.id}
                        </span>
                      </div>

                      {/* Photo & Details layout */}
                      <div className="flex gap-4">
                        {/* Retro passport photo */}
                        <div className="w-24 h-32 border-[2px] border-[#111] bg-stone-200 flex flex-col items-center justify-center p-1 rounded-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                          <div className="w-full h-full bg-stone-300 border border-stone-400 flex items-center justify-center text-stone-500 font-mono text-[9px] text-center uppercase shadow-inner">
                            AGT photo
                          </div>
                        </div>

                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="text-[9px] text-stone-500 uppercase font-black tracking-wider">
                              Name / नाम
                            </div>
                            <div className="font-black text-lg text-[#111] leading-tight">
                              {agent.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-stone-500 uppercase font-black tracking-wider">
                              Creator / निर्माता
                            </div>
                            <div className="font-bold text-[13px] text-stone-800">
                              {agent.creator}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-stone-500 uppercase font-black tracking-wider">
                              Trust Score / विश्वास स्कोर
                            </div>
                            <div className="font-black text-[13px] text-green-700">
                              {agent.trustScore} / 100
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 bg-stone-100/50 p-2 border border-stone-300 rounded">
                        <div className="text-[9px] text-stone-500 uppercase font-black tracking-wider">
                          Purpose / उद्देश्य
                        </div>
                        <p className="text-stone-800 line-clamp-3 leading-relaxed text-[11px] font-medium">
                          {agent.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Machine Readable Zone (MRZ) */}
                    <div className="bg-stone-100 border-[2px] border-[#111] p-3 rounded-sm font-mono text-[10px] font-bold tracking-widest text-stone-700 select-all leading-relaxed mt-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                      P&lt;AGT&lt;&lt;{agent.name.replace(/\s+/g, "").toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br />
                      {agent.id.replace(/-/g, "")}&lt;&lt;{agent.creator.replace(/\s+/g, "").toUpperCase()}
                    </div>

                    {/* Dashboard shortcuts */}
                    <div className="flex gap-2 mt-4 justify-center">
                      {isOpen && (
                        <button
                          className="xp-btn text-[11px]"
                          onClick={() => setIsOpen(false)}
                        >
                          Close Cover
                        </button>
                      )}
                      <button
                        className="xp-btn text-[11px]"
                        onClick={() => navigate("/passport")}
                      >
                        View Info
                      </button>
                      <button
                        className="xp-btn xp-btn-primary text-[11px]"
                        onClick={() => navigate("/visa")}
                      >
                        Apply Visa
                      </button>
                    </div>
                  </div>
                ) : (
                  // Case B: No Agent - Show Registration Form
                  <div className="h-full flex flex-col justify-between py-1">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">

                      <div className="flex gap-1 border-b-[2px] border-[#111] pb-2 mb-3">
                        <button
                          className={`flex-1 text-[10px] font-black uppercase tracking-widest py-1 border-[2px] ${regMode === 'url' ? 'bg-[#111] text-white border-[#111]' : 'bg-[#fdfaf0] text-[#111] border-[#111]'}`}
                          onClick={() => setRegMode("url")}
                          type="button"
                        >
                          🌐 Via URL
                        </button>
                        <button
                          className={`flex-1 text-[10px] font-black uppercase tracking-widest py-1 border-[2px] ${regMode === 'manual' ? 'bg-[#111] text-white border-[#111]' : 'bg-[#fdfaf0] text-[#111] border-[#111]'}`}
                          onClick={() => setRegMode("manual")}
                          type="button"
                        >
                          ✍️ Manual
                        </button>
                      </div>

                      {regMode === "url" ? (
                        <form onSubmit={handleUrlSubmit} className="space-y-3">
                          <p className="text-[11px] font-bold text-stone-700 leading-relaxed mb-3">
                            Connect a live AI Agent endpoint. We will fetch its metadata (purpose, creator, and performance metrics) over HTTPS and assign a trust score automatically!
                          </p>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-stone-600 mb-1">
                              Agent Endpoint URL
                            </label>
                            <input
                              className="xp-input w-full py-1.5 text-xs font-bold text-[#1D3D7A] font-mono"
                              value={agentUrl}
                              onChange={(e) => setAgentUrl(e.target.value)}
                              placeholder="http://localhost:4001/metadata"
                            />
                          </div>

                          {error && (
                            <p className="bg-red-100 border-[2px] border-red-600 text-red-800 text-[10px] p-2 rounded text-center my-2 font-bold shadow-[2px_2px_0_rgba(220,38,38,0.5)]">
                              {error}
                            </p>
                          )}

                          <div className="pt-4 flex justify-end gap-2">
                            {isOpen && (
                              <button type="button" className="xp-btn text-[11px]" onClick={() => setIsOpen(false)}>
                                Close Cover
                              </button>
                            )}
                            <button type="submit" disabled={loading} className="xp-btn xp-btn-primary text-[11px]">
                              {loading ? "Fetching & Analyzing..." : "Fetch & Register →"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <form onSubmit={handleManualSubmit} className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-stone-600 mb-1">
                              Agent Name
                            </label>
                            <input
                              className="xp-input w-full py-1.5 text-xs font-bold text-[#111]"
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                              placeholder="e.g. ShoppingBot"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-stone-600 mb-1">
                              Creator
                            </label>
                            <input
                              className="xp-input w-full py-1.5 text-xs font-bold text-[#111]"
                              value={form.creator}
                              onChange={(e) => setForm({ ...form, creator: e.target.value })}
                              placeholder="e.g. Acme Corp"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-stone-600 mb-1">
                              Purpose
                            </label>
                            <textarea
                              className="xp-input w-full py-1.5 text-xs leading-normal font-medium text-[#111] resize-none"
                              rows={3}
                              value={form.purpose}
                              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                              placeholder="Assists with shopping and Cart checkouts."
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-stone-600 mb-1">
                              Permissions
                            </label>
                            <div className="xp-panel p-3 grid grid-cols-2 gap-2 bg-[#fdfaf0]">
                              {PERMISSION_OPTIONS.map((opt) => (
                                <label key={opt.id} className="flex items-center gap-2 text-[10px] font-bold text-[#111] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={permissions.includes(opt.id)}
                                    onChange={() => togglePermission(opt.id)}
                                    className="accent-[#111] w-3.5 h-3.5"
                                  />
                                  <span className="truncate">{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {error && (
                            <p className="bg-red-100 border-[2px] border-red-600 text-red-800 text-[10px] p-2 rounded text-center my-2 font-bold shadow-[2px_2px_0_rgba(220,38,38,0.5)]">
                              {error}
                            </p>
                          )}

                          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-stone-300">
                            {isOpen && (
                              <button
                                type="button"
                                className="xp-btn text-[11px]"
                                onClick={() => setIsOpen(false)}
                              >
                                Close Cover
                              </button>
                            )}
                            <button
                              type="submit"
                              disabled={loading}
                              className="xp-btn xp-btn-primary text-[11px]"
                            >
                              {loading ? "Registering..." : "Apply on-chain →"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Announcements */}
      <div className="hidden lg:block w-64 mt-8 bg-[#F5EDB9] border-[3px] border-[#111] p-5 shadow-[4px_4px_0_rgba(0,0,0,0.5)] z-10 font-sans">
        <h3 className="font-black text-[12px] bg-[#BFA8EA] border-[3px] border-[#111] p-1.5 mb-5 text-center uppercase tracking-widest text-[#111] shadow-[2px_2px_0_#111]">
          ⭐ Announcements
        </h3>
        <ul className="text-[11px] space-y-5">
          <li className="relative pl-4">
            <span className="absolute left-0 top-1.5 w-2 h-2 bg-[#111] rounded-full"></span>
            <strong className="block uppercase text-[#1D3D7A] font-black text-[12px]">New Visa Protocol</strong>
            v2.0 is now live!<br />
            <span className="text-[#111] font-bold opacity-70">[ 05 / 05 / 2006 ]</span>
          </li>
          <li className="relative pl-4">
            <span className="absolute left-0 top-1.5 w-2 h-2 bg-[#111] rounded-full"></span>
            <strong className="block uppercase text-[#1D3D7A] font-black text-[12px]">Agent Summit 2006</strong>
            Join us in New Tokyo.<br />
            <span className="text-[#111] font-bold opacity-70">[ 12 / 06 / 2006 ]</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
