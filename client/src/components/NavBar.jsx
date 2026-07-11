import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Register" },
  { to: "/passport", label: "Passport" },
  { to: "/visa", label: "Apply for Visa" },
  { to: "/stamps", label: "Activity Log" },
  { to: "/trust", label: "Trust Score" },
  { to: "/blacklist", label: "Blacklist" },
];

export default function NavBar({ agentId }) {
  const loc = useLocation();
  return (
    <div className="max-w-3xl w-full mx-auto mb-3 flex flex-wrap gap-1 text-xs">
      {links.map((l) => {
        const exempt = l.to === "/" || l.to === "/blacklist";
        const disabled = !exempt && !agentId;
        const active = loc.pathname === l.to;
        return (
          <Link
            key={l.to}
            to={disabled ? "#" : l.to}
            onClick={(e) => disabled && e.preventDefault()}
            className={`px-3 py-1 rounded-t border border-b-0 font-bold ${
              active
                ? "bg-xpface border-xpblue-dark text-xpblue-dark"
                : disabled
                ? "bg-xpblue-dark/40 border-transparent text-white/50 cursor-not-allowed"
                : "bg-xpblue-light/70 border-transparent text-white hover:bg-xpblue-light"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
