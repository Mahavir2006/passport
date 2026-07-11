import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/home", label: "REGISTER" },
  { to: "/passport", label: "PASSPORT" },
  { to: "/visa", label: "APPLY FOR VISA" },
  { to: "/stamps", label: "ACTIVITY LOG" },
  { to: "/trust", label: "TRUST SCORE" },
  { to: "/blacklist", label: "BLACKLIST" },
];

export default function NavBar({ agentId }) {
  const loc = useLocation();
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-wrap gap-0 text-[11px] uppercase font-bold justify-center px-4 relative z-10">
      {links.map((l, idx) => {
        const exempt = l.to === "/home" || l.to === "/blacklist";
        const disabled = !exempt && !agentId;
        const active = loc.pathname === l.to;
        return (
          <Link
            key={l.to}
            to={disabled ? "#" : l.to}
            onClick={(e) => disabled && e.preventDefault()}
            className={`px-4 py-2 flex items-center gap-2 border-[3px] border-[#111] ${idx !== 0 ? 'ml-[-3px]' : ''} ${
              active
                ? "bg-[#FCD86C] text-[#111] z-10 shadow-[2px_-2px_0px_rgba(0,0,0,0.5)] transform -translate-y-1"
                : disabled
                ? "bg-[#D9D1A2] text-[#111]/40 cursor-not-allowed opacity-80"
                : "bg-[#F5EDB9] text-[#111] hover:bg-[#FCD86C] hover:z-10 hover:-translate-y-0.5 transition-transform"
            }`}
          >
            <span className="text-sm drop-shadow-[1px_1px_0_rgba(255,255,255,0.5)]">{l.icon}</span>
            <span className={active ? "drop-shadow-[1px_1px_0_rgba(255,255,255,0.5)]" : ""}>{l.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
