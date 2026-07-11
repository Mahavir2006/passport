import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Win95 palette ──────────────────────────────────────────────────────── */
const W95 = {
  DESKTOP:   "#008080",
  FACE:      "#c0c0c0",
  SHADOW:    "#808080",
  HILIGHT:   "#ffffff",
  DARKDARK:  "#000000",
  TITLEBAR:  "#000080",
  TITLETEXT: "#ffffff",
  BTNTEXT:   "#000000",
  SUNKEN_BG: "#ffffff",
  RED:       "#800000",
};

/* Raised bevel (light top-left, dark bottom-right) */
const raised = {
  borderStyle: "solid",
  borderWidth: "2px",
  borderColor: `${W95.HILIGHT} ${W95.DARKDARK} ${W95.DARKDARK} ${W95.HILIGHT}`,
  outline: `1px solid ${W95.SHADOW}`,
  outlineOffset: "-2px",
};

/* Sunken bevel (dark top-left, light bottom-right) */
const sunken = {
  borderStyle: "solid",
  borderWidth: "2px",
  borderColor: `${W95.SHADOW} ${W95.HILIGHT} ${W95.HILIGHT} ${W95.SHADOW}`,
  outline: `1px solid ${W95.DARKDARK}`,
  outlineOffset: "-2px",
};

/* Base button style */
const btnBase = {
  ...raised,
  background: W95.FACE,
  color: W95.BTNTEXT,
  fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
  fontSize: 15,
  fontWeight: "bold",
  cursor: "pointer",
  padding: "6px 18px",
  textTransform: "uppercase",
  letterSpacing: 1,
  userSelect: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
  lineHeight: 1.3,
};

/* Win95 window chrome wrapper */
const windowChrome = {
  ...raised,
  background: W95.FACE,
  fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function Win95TitleBar({ icon, title, active = true }) {
  return (
    <div
      style={{
        background: active
          ? "linear-gradient(90deg, #000080 0%, #1084d0 100%)"
          : W95.SHADOW,
        padding: "5px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: W95.TITLETEXT,
        fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
        fontSize: 15,
        fontWeight: "bold",
        userSelect: "none",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        {title}
      </span>
      <span style={{ display: "flex", gap: 3 }}>
        {["_", "□", "✕"].map((lbl, i) => (
          <span
            key={i}
            style={{
              ...btnBase,
              padding: "2px 7px",
              fontSize: 13,
              background: i === 2 ? W95.RED : W95.FACE,
              color: i === 2 ? W95.HILIGHT : W95.BTNTEXT,
              minWidth: 24,
              justifyContent: "center",
            }}
          >
            {lbl}
          </span>
        ))}
      </span>
    </div>
  );
}

function Win95Btn({ children, onClick, primary, big, style: extraStyle }) {
  const [pressed, setPressed] = React.useState(false);

  const base = {
    ...btnBase,
    ...(primary
      ? {
          background: "#000080",
          color: W95.TITLETEXT,
          borderColor: `${W95.HILIGHT} ${W95.DARKDARK} ${W95.DARKDARK} ${W95.HILIGHT}`,
        }
      : {}),
    ...(big ? { padding: "9px 28px", fontSize: 17 } : {}),
    ...(pressed
      ? {
          borderColor: `${W95.DARKDARK} ${W95.HILIGHT} ${W95.HILIGHT} ${W95.DARKDARK}`,
          transform: "translate(1px, 1px)",
        }
      : {}),
    ...extraStyle,
  };

  return (
    <button
      style={base}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onClick && onClick(); }}
      onMouseLeave={() => setPressed(false)}
    >
      {children}
    </button>
  );
}

function FeatureCard({ icon, title, desc }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{
        ...sunken,
        background: hovered ? "#000080" : W95.SUNKEN_BG,
        color: hovered ? W95.TITLETEXT : W95.BTNTEXT,
        padding: 12,
        cursor: "default",
        transition: "none",   /* INSTANT — no easing */
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card header */}
      <div
        style={{
          background: hovered ? W95.TITLEBAR : W95.FACE,
          ...raised,
          padding: "5px 10px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: "bold",
          fontSize: 15,
          fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
          color: hovered ? W95.TITLETEXT : W95.BTNTEXT,
        }}
      >
        <span style={{ fontSize: 22 }}>{icon}</span>
        {title}
      </div>
      {/* Card body */}
      <div
        style={{
          fontSize: 14,
          fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
          lineHeight: 1.6,
          paddingLeft: 6,
          color: hovered ? "#c0c8ff" : "#333",
        }}
      >
        {desc}
      </div>
    </div>
  );
}

function HRule() {
  return (
    <div style={{ margin: "12px 0" }}>
      <div style={{ borderTop: `1px solid ${W95.SHADOW}`, borderBottom: `1px solid ${W95.HILIGHT}` }} />
    </div>
  );
}

/* ─── Login / Register tabbed panel ─────────────────────────────────────── */
function LoginPanel({ navigate }) {
  const [tab,      setTab]      = useState("login");     // "login" | "register"
  const [name,     setName]     = useState("");
  const [username, setUsername] = useState("");
  const [pass,     setPass]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  function reset() { setName(""); setUsername(""); setPass(""); setError(""); }
  function switchTab(t) { reset(); setTab(t); }

  const inputStyle = {
    ...sunken,
    background: "#ffffff",
    padding: "5px 8px",
    fontSize: 15,
    fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
    width: "100%",
    boxSizing: "border-box",
    color: "#000",
    outline: "none",
  };

  const labelStyle = {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
    marginBottom: 4,
    display: "block",
    color: "#000080",
    textTransform: "uppercase",
    letterSpacing: 1,
  };

  async function handleLogin() {
    if (!username.trim() || !pass.trim()) {
      setError("⚠ Username and Password cannot be empty.");
      return;
    }
    setError(""); setLoading(true);
    try {
      const { loginUser } = await import("../lib/auth.js");
      const { user } = await loginUser({ username: username.trim(), password: pass });
      sessionStorage.setItem("authUser", JSON.stringify(user));
      navigate("/home");
    } catch (e) {
      setError("⚠ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!name.trim() || !username.trim() || !pass.trim()) {
      setError("⚠ All fields are required.");
      return;
    }
    setError(""); setLoading(true);
    try {
      const { registerUser } = await import("../lib/auth.js");
      const { user } = await registerUser({ name: name.trim(), username: username.trim(), password: pass });
      sessionStorage.setItem("authUser", JSON.stringify(user));
      navigate("/home");
    } catch (e) {
      setError("⚠ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") tab === "login" ? handleLogin() : handleRegister();
  }

  /* Tab button style */
  const tabBtn = (active) => ({
    ...raised,
    background: active ? W95.SUNKEN_BG : W95.FACE,
    color: active ? "#000080" : W95.BTNTEXT,
    fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
    padding: "5px 18px",
    textTransform: "uppercase",
    letterSpacing: 1,
    userSelect: "none",
    border: "none",
    borderBottom: active ? `2px solid ${W95.SUNKEN_BG}` : "none",
    marginBottom: active ? -2 : 0,
    zIndex: active ? 2 : 1,
    position: "relative",
  });

  return (
    <div
      style={{
        ...raised,
        background: W95.FACE,
        flexShrink: 0,
        width: 300,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Inner title bar */}
      <div
        style={{
          background: "linear-gradient(90deg, #000080 0%, #1084d0 100%)",
          padding: "5px 10px",
          color: "#fff",
          fontWeight: "bold",
          fontSize: 14,
          fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
          letterSpacing: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 18 }}>🔐</span> AGENT PORTAL
      </div>

      {/* Tab row */}
      <div style={{ display: "flex", padding: "8px 8px 0", borderBottom: `2px solid ${W95.SHADOW}`, gap: 4 }}>
        <button style={tabBtn(tab === "login")}    onClick={() => switchTab("login")}>Login</button>
        <button style={tabBtn(tab === "register")} onClick={() => switchTab("register")}>Register</button>
      </div>

      {/* Tab body */}
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

        {/* User icon */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 48 }}>{tab === "login" ? "👤" : "📝"}</span>
          <div style={{ fontSize: 13, color: W95.SHADOW, fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif", marginTop: 4 }}>
            {tab === "login" ? "Sign in to your account" : "Create a new account"}
          </div>
        </div>

        {/* Name field — register only */}
        {tab === "register" && (
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              style={inputStyle}
              type="text"
              value={name}
              placeholder="e.g. John Smith"
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={handleKey}
              autoComplete="off"
            />
          </div>
        )}

        {/* Username */}
        <div>
          <label style={labelStyle}>Username</label>
          <input
            style={inputStyle}
            type="text"
            value={username}
            placeholder="Enter username"
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            onKeyDown={handleKey}
            autoComplete="off"
          />
        </div>

        {/* Password */}
        <div>
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            type="password"
            value={pass}
            placeholder="Enter password"
            onChange={(e) => { setPass(e.target.value); setError(""); }}
            onKeyDown={handleKey}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              ...sunken,
              background: "#fff8f8",
              padding: "6px 10px",
              fontSize: 13,
              color: "#800000",
              fontWeight: "bold",
              fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
            }}
          >
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          <Win95Btn
            primary
            big
            style={{ flex: 1, justifyContent: "center" }}
            onClick={tab === "login" ? handleLogin : handleRegister}
          >
            {loading ? "..." : tab === "login" ? "OK" : "Register"}
          </Win95Btn>
          <Win95Btn
            big
            style={{ flex: 1, justifyContent: "center" }}
            onClick={reset}
          >
            Cancel
          </Win95Btn>
        </div>

        <div style={{ fontSize: 11, color: W95.SHADOW, fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif", textAlign: "center", lineHeight: 1.5 }}>
          Authorised users only.<br />Unauthorised access is prohibited.
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function LandinCoverPage() {
  const navigate = useNavigate();

  const [time, setTime] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const fmtTime = (d) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#2B54A3",
        backgroundImage: "linear-gradient(rgba(43, 84, 163, 0.7), rgba(43, 84, 163, 0.7)), url('/xp-bg.jpg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        fontFamily: "MS Sans Serif, Tahoma, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ══════════════ TOP TASKBAR ══════════════ */}
      <div
        style={{
          ...raised,
          background: W95.FACE,
          padding: "4px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Win95Btn big style={{ background: W95.FACE, fontWeight: 900 }}>
          <span style={{ fontSize: 20 }}>🪟</span> Start
        </Win95Btn>

        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          {["🔒", "🌐"].map((ico, i) => (
            <span
              key={i}
              title={["Security", "Internet"][i]}
              style={{ ...raised, padding: "3px 8px", fontSize: 20, cursor: "pointer", background: W95.FACE }}
            >
              {ico}
            </span>
          ))}
        </div>

        <div
          style={{
            ...sunken,
            flex: 1,
            maxWidth: 420,
            padding: "4px 12px",
            fontSize: 15,
            fontWeight: "bold",
            background: W95.FACE,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          AgentPassport — Immigration Services for AI Agents
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            ...sunken,
            padding: "4px 14px",
            fontSize: 15,
            fontWeight: "bold",
            background: W95.FACE,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>🔊</span>
          <span>🌐</span>
          <span style={{ borderLeft: `1px solid ${W95.SHADOW}`, paddingLeft: 10 }}>
            {fmtTime(time)}
          </span>
        </div>
      </div>

      {/* ══════════════ DESKTOP AREA ══════════════ */}
      <div
        style={{
          flex: 1,
          padding: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* ── HERO WINDOW ── */}
        <div style={{ ...windowChrome, width: "100%", maxWidth: 1100, overflow: "hidden" }}>
          <Win95TitleBar icon="🛂" title="AgentPassport.exe — Welcome" />
          <div style={{ background: W95.FACE }}>
            {/* Menu bar */}
            <div
              style={{
                background: W95.FACE,
                borderBottom: `1px solid ${W95.SHADOW}`,
                padding: "3px 12px",
                display: "flex",
                gap: 20,
                fontSize: 15,
              }}
            >
              {["File", "Edit", "View", "Help"].map((m) => (
                <span
                  key={m}
                  style={{ padding: "3px 8px", cursor: "default", userSelect: "none" }}
                  onMouseEnter={(e) => { e.target.style.background = W95.TITLEBAR; e.target.style.color = W95.TITLETEXT; }}
                  onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = W95.BTNTEXT; }}
                >
                  {m}
                </span>
              ))}
            </div>

            {/* Hero body — 3 columns: icon | description | login */}
            <div style={{ padding: 24, display: "flex", gap: 24, alignItems: "flex-start" }}>

              {/* ① Icon panel */}
              <div
                style={{
                  ...sunken,
                  background: "#000080",
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 200,
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 88, lineHeight: 1 }}>🛂</span>
                <div style={{ color: "#ffff00", fontWeight: "bold", fontSize: 18, textAlign: "center", textShadow: "1px 1px 0 #000", letterSpacing: 2 }}>
                  AGENT<br />PASSPORT
                </div>
                <div style={{ color: "#c0c0c0", fontSize: 14, textAlign: "center", letterSpacing: 1 }}>
                  v2.0.06<br />EST. 2006
                </div>
              </div>

              {/* ② Description */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 30, fontWeight: "bold", color: "#000080", marginBottom: 6, letterSpacing: 2, textTransform: "uppercase", textShadow: `1px 1px 0 ${W95.SHADOW}` }}>
                  🌐 AgentPassport
                </div>
                <div style={{ fontSize: 17, color: "#800000", fontWeight: "bold", marginBottom: 14, letterSpacing: 1 }}>
                  ★ Immigration Services for AI Agents ★
                </div>

                <HRule />

                <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 14 }}>
                  <b>AgentPassport</b> is a blockchain-based identity &amp; immigration system
                  for autonomous AI agents. Register your agent, receive an on-chain
                  passport, apply for visas to enter digital environments, and track
                  every action on an immutable ledger.
                </p>

                <p style={{ fontSize: 16, lineHeight: 1.8, color: "#000080", fontWeight: "bold" }}>
                  ➤ Powered by a Solidity smart contract on a local Hardhat node.<br />
                  ➤ AI risk-assessment via Groq (llama-3.3-70b) with heuristic fallback.<br />
                  ➤ Every trust score change, visa, and stamp is a permanent on-chain tx.
                </p>
              </div>

              {/* ③ Login panel */}
              <LoginPanel navigate={navigate} />
            </div>

            {/* Status bar */}
            <div style={{ borderTop: `1px solid ${W95.SHADOW}`, padding: "4px 12px", display: "flex", gap: 10, fontSize: 14 }}>
              <div style={{ ...sunken, padding: "2px 12px", flex: 2 }}>✅ Blockchain node connected — Hardhat localhost:8545</div>
              <div style={{ ...sunken, padding: "2px 12px", flex: 1 }}>Agents registered: 18,593</div>
              <div style={{ ...sunken, padding: "2px 12px", flex: 1 }}>🔒 128-bit encryption</div>
            </div>
          </div>
        </div>

        {/* ── FEATURES WINDOW ── */}
        <div style={{ ...windowChrome, width: "100%", maxWidth: 1100 }}>
          <Win95TitleBar icon="📦" title="Features — AgentPassport" />

          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 14, color: "#000080", textTransform: "uppercase", letterSpacing: 1 }}>
              📌 What Does AgentPassport Do?
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              <FeatureCard icon="🪪" title="Agent Registration"
                desc="Register any AI agent with name, creator, purpose and requested permissions. Receive a unique on-chain passport ID (AGT-XXXXXXXX)." />
              <FeatureCard icon="🤖" title="AI Risk Assessment"
                desc="Groq LLM (llama-3.3-70b) analyzes each agent's stated purpose and assigns a trust score (0–100), risk level, and spending limit." />
              <FeatureCard icon="📜" title="Digital Passport"
                desc="Every agent gets a permanent on-chain ID card: verification status, trust score, granted permissions, spending limit and issuance timestamp." />
              <FeatureCard icon="✈" title="Visa Applications"
                desc="Agents apply for visas to enter 4 demo sites: ShopSite.com, SocialHub.com, DataVault.com, NewsWire.com — each with trust score thresholds." />
              <FeatureCard icon="🛃" title="Immigration Checkpoint"
                desc="A border-check simulation with a rule engine. Returns Access Granted ✅ or Access Denied ❌ with the full reasoning on-chain." />
              <FeatureCard icon="🗂" title="Activity Stamps"
                desc="Every approved entry mints an on-chain stamp. The activity log shows your full visa history, approvals, denials and timestamps." />
              <FeatureCard icon="📊" title="Trust Score Dashboard"
                desc="Live trust bar with colour coding. Dev controls simulate good (+15), bad (−15) and malicious (−50) behaviour — all written on-chain." />
              <FeatureCard icon="🚫" title="Blacklist Database"
                desc="Admins add watchlist entries by agent name or creator. Any matching registered agent is instantly blacklisted and denied all visas." />
              <FeatureCard icon="🔗" title="On-Chain Transparency"
                desc="Every action — registration, trust update, visa, stamp — emits a Solidity event and returns a tx hash shown as a notification banner." />
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS + ENTER BUTTONS ── */}
        <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 1100, alignItems: "flex-start" }}>

          {/* How it works */}
          <div style={{ ...windowChrome, flex: 2 }}>
            <Win95TitleBar icon="" title="How It Works" />
            <div style={{ padding: 18 }}>
              {[
                ["1", "Start the Hardhat blockchain node (npx hardhat node)"],
                ["2", "Deploy the AgentPassport.sol smart contract"],
                ["3", "Launch the app (npm run dev) — server :4000, client :5173"],
                ["4", "Click Register Agent → fill in name, creator & purpose"],
                ["5", "Your agent is analysed by AI and minted on-chain"],
                ["6", "Apply for Visas, check Stamps, monitor the Trust Score"],
              ].map(([n, txt]) => (
                <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10, fontSize: 15 }}>
                  <span
                    style={{
                      ...raised,
                      background: "#000080",
                      color: W95.TITLETEXT,
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {n}
                  </span>
                  <span style={{ lineHeight: 1.7 }}>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enter the system */}
          <div style={{ ...windowChrome, flex: 1, minWidth: 260 }}>
            <Win95TitleBar icon="" title="Enter the System" />
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ ...sunken, background: W95.SUNKEN_BG, padding: 10, fontSize: 15, marginBottom: 4 }}>
                Select a section to enter:
              </div>
              {[
                { icon: "", label: "Register New Agent", path: "/home",        primary: true },
                { icon: "", label: "View Digital Passport",  path: "/passport",    primary: false },
                { icon: "", label: "Apply for Visa",     path: "/visa" },
                { icon: "", label: "Immigration Check",   path: "/immigration" },
                { icon: "", label: "Activity Stamps",     path: "/stamps" },
                { icon: "", label: "Trust Dashboard",     path: "/trust" },
                { icon: "", label: "Blacklist Database",  path: "/blacklist" },
              ].map(({ icon, label, path, primary }) => (
                <Win95Btn
                  key={path}
                  primary={primary}
                  style={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={() => navigate(path)}
                >
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  {label}
                </Win95Btn>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER badge bar ── */}
        <div
          style={{
            ...raised,
            background: W95.FACE,
            width: "100%",
            maxWidth: 1100,
            padding: "8px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...raised, background: "#000080", color: W95.TITLETEXT, padding: "3px 10px", fontWeight: "bold", fontSize: 15, letterSpacing: 1 }}>
              e
            </div>
            <span>Best viewed in Internet Explorer 4.0 · 1024×768</span>
          </div>

          <span>© 2006 Republic of Agents — Digital Immigration Division</span>

          <div style={{ display: "flex", gap: 6 }}>
            {["W3C HTML 3.2", "Bobby AA"].map((badge) => (
              <span key={badge} style={{ ...raised, padding: "2px 8px", fontSize: 13, fontWeight: "bold", background: W95.FACE }}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ BOTTOM STATUS BAR ══════════════ */}
      <div
        style={{
          ...raised,
          background: W95.FACE,
          padding: "4px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        <span style={{ color: W95.SHADOW }}>
          📌 Tip: Hover over any feature box to highlight it. Click a button to enter the system.
        </span>
        <span style={{ color: "#000080", fontWeight: "bold" }}>
          🔒 Secure Connection · 128-bit
        </span>
      </div>
    </div>
  );
}
