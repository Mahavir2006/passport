import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

const PERMISSION_OPTIONS = [
  { id: "browse_web", label: "Browse the Web" },
  { id: "make_payments", label: "Make Payments" },
  { id: "post_content", label: "Post Content" },
  { id: "read_data", label: "Read Data" },
  { id: "delete_data", label: "Delete Data" },
  { id: "admin_access", label: "Admin Access" },
];

export default function LandingPage({ agent, onRegistered }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", creator: "", purpose: "" });
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const togglePermission = (id) => {
    setPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-8">
      {/* Description or instruction */}
      <div className="text-center mb-6 max-w-md bg-[#ffffcc] border-2 border-[#cccc00] p-3 shadow-md rounded text-sm text-[#333000] font-sans">
        <p className="font-bold mb-1">📢 Welcome to the Agent Passport Office</p>
        <p className="text-xs">
          Click the passport cover below to flip it open. Complete your details on-chain to register your agent.
        </p>
      </div>

      {/* 3D Booklet Container */}
      <div className="passport-perspective py-6">
        <div
          className={`passport-container cursor-pointer ${isOpen ? "open" : ""}`}
          onClick={() => !isOpen && setIsOpen(true)}
        >
          <div className="passport-book">
            {/* Flipping Leaf (Front Cover + Left Inner Page back-to-back) */}
            <div className="passport-leaf passport-flip-leaf">
              {/* Front Cover Face */}
              <div className="passport-page-face passport-cover-front flex flex-col items-center justify-between py-10 px-4 text-center select-none">
                {/* Top Text (inspired by Indian passport) */}
                <div className="space-y-1">
                  <h2 className="gold-foil font-bold tracking-widest text-[16px] uppercase font-serif">
                    Republic of Agents
                  </h2>
                  <h3 className="gold-foil text-[12px] tracking-wider opacity-85">
                    एजेंट गणराज्य
                  </h3>
                </div>

                {/* Custom AI/Indian National Emblem Gold SVG (Slightly larger) */}
                <div className="w-28 h-28 my-4 flex items-center justify-center">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                  >
                    {/* Circuit wheel Ashoka Chakra */}
                    <circle
                      cx="50"
                      cy="50"
                      r="24"
                      fill="none"
                      stroke="url(#goldGrad)"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="16"
                      fill="none"
                      stroke="url(#goldGrad)"
                      strokeWidth="1.5"
                    />
                    {/* Microchip tracks radiating */}
                    <path
                      d="M50,10 L50,26 M50,74 L50,90 M10,50 L26,50 M74,50 L90,50 M22,22 L34,34 M66,66 L78,78 M22,78 L34,66 M66,34 L78,22"
                      stroke="url(#goldGrad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Core Node */}
                    <circle cx="50" cy="50" r="6" fill="url(#goldGrad)" />
                    {/* Definition for gold gradient */}
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
                <div className="space-y-1">
                  <h1 className="gold-foil font-bold text-2xl tracking-widest uppercase font-serif">
                    Passport
                  </h1>
                  <h3 className="gold-foil text-xs tracking-wider opacity-85">
                    पासपोर्ट
                  </h3>
                </div>
              </div>

              {/* Left Page Face (Guidelines & Signature) */}
              <div className="passport-page-face passport-page-left passport-watermark p-8 flex flex-col justify-between text-xs text-stone-800 font-serif">
                <div className="space-y-4">
                  <div className="border-b-2 border-stone-400 pb-2 text-center">
                    <span className="font-bold tracking-wider text-[11px] uppercase">
                      Government of AI Authority
                    </span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    These are to request and require in the Name of the Sovereign authority of AI Agents to allow the bearer to pass freely without let or hindrance, and to afford the bearer every assistance and protection of which he stands in need.
                  </p>
                </div>

                {/* Signature Area */}
                <div className="mt-8 text-center space-y-1">
                  <div className="font-mono italic text-[#2563eb] text-base transform -rotate-6 select-none opacity-80">
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
              onClick={(e) => e.stopPropagation()} // Stop flip triggers when clicking page content
            >
              {agent ? (
                // Case A: Agent already registered - Show Booklet Details Page
                <div className="h-full flex flex-col justify-between py-2">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-stone-400 pb-1.5">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-stone-600">
                        AI Passport / ए.आई. पासपोर्ट
                      </span>
                      <span className="font-bold text-red-600 text-[11px]">
                        {agent.id}
                      </span>
                    </div>

                    {/* Photo & Details layout */}
                    <div className="flex gap-4">
                      {/* Retro passport photo */}
                      <div className="w-24 h-28 border border-stone-400 bg-stone-200 flex flex-col items-center justify-center p-1 rounded shadow-inner">
                        <div className="w-full h-full bg-stone-300 rounded border border-stone-400 flex items-center justify-center text-stone-500 font-mono text-[9px] text-center uppercase">
                          AGT photo
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="text-[9px] text-stone-500 uppercase font-semibold">
                            Name / नाम
                          </div>
                          <div className="font-bold text-base text-stone-900 leading-tight">
                            {agent.name}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-stone-500 uppercase font-semibold">
                            Creator / निर्माता
                          </div>
                          <div className="font-bold text-sm text-stone-800">
                            {agent.creator}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-stone-500 uppercase font-semibold">
                            Trust Score / विश्वास स्कोर
                          </div>
                          <div className="font-bold text-sm text-green-700">
                            {agent.trustScore} / 100
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[9px] text-stone-500 uppercase font-semibold">
                        Purpose / उद्देश्य
                      </div>
                      <p className="text-stone-700 line-clamp-3 leading-relaxed text-[11px]">
                        {agent.purpose}
                      </p>
                    </div>
                  </div>

                  {/* Machine Readable Zone (MRZ) - Classic retro passport look */}
                  <div className="bg-stone-100 border border-stone-300 p-2.5 rounded font-mono text-[9.5px] tracking-widest text-stone-700 select-all leading-relaxed mt-4">
                    P&lt;AGT&lt;&lt;{agent.name.replace(/\s+/g, "").toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br />
                    {agent.id.replace(/-/g, "")}&lt;&lt;{agent.creator.replace(/\s+/g, "").toUpperCase()}
                  </div>

                  {/* Dashboard shortcuts */}
                  <div className="flex gap-2 mt-4 justify-center">
                    {isOpen && (
                      <button
                        className="xp-btn text-[11px] py-1 px-4"
                        onClick={() => setIsOpen(false)}
                      >
                        Close Cover
                      </button>
                    )}
                    <button
                      className="xp-btn text-[11px] py-1 px-4"
                      onClick={() => navigate("/passport")}
                    >
                      View Info
                    </button>
                    <button
                      className="xp-btn xp-btn-primary text-[11px] py-1 px-4"
                      onClick={() => navigate("/visa")}
                    >
                      Apply Visa
                    </button>
                  </div>
                </div>
              ) : (
                // Case B: No Agent - Show Registration Form
                <form
                  onSubmit={handleSubmit}
                  className="h-full flex flex-col justify-between py-1"
                >
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    <h3 className="font-bold text-center text-[11px] uppercase text-stone-700 border-b border-stone-300 pb-1.5">
                      New Agent Application / नया आवेदन
                    </h3>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-stone-500">
                        Agent Name
                      </label>
                      <input
                        className="xp-input w-full py-1 text-xs"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. ShoppingBot"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-stone-500">
                        Creator
                      </label>
                      <input
                        className="xp-input w-full py-1 text-xs"
                        value={form.creator}
                        onChange={(e) => setForm({ ...form, creator: e.target.value })}
                        placeholder="e.g. Acme Corp"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-stone-500">
                        Purpose
                      </label>
                      <textarea
                        className="xp-input w-full py-1 text-xs leading-normal"
                        rows={3}
                        value={form.purpose}
                        onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                        placeholder="Assists with shopping and Cart checkouts."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-stone-500 mb-1">
                        Permissions
                      </label>
                      <div className="xp-panel p-2.5 grid grid-cols-2 gap-1.5 bg-stone-50 border border-stone-200 rounded">
                        {PERMISSION_OPTIONS.map((opt) => (
                          <label key={opt.id} className="flex items-center gap-1.5 text-[10px]">
                            <input
                              type="checkbox"
                              checked={permissions.includes(opt.id)}
                              onChange={() => togglePermission(opt.id)}
                            />
                            <span className="truncate">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className="bg-red-50 border border-red-200 text-red-700 text-[10px] p-2 rounded text-center my-2">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    {isOpen && (
                      <button
                        type="button"
                        className="xp-btn text-[11px] py-1 px-4"
                        onClick={() => setIsOpen(false)}
                      >
                        Close Cover
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="xp-btn xp-btn-primary text-[11px] py-1 px-4"
                    >
                      {loading ? "Registering..." : "Apply on-chain →"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
