import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import XpWindow from "../components/XpWindow.jsx";
import { api } from "../lib/api.js";

export default function VisaPage({ agent }) {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    api.listWebsites().then((sites) => {
      setWebsites(sites);
      if (sites.length) setSelected(sites[0].name);
    });
  }, []);

  const handleApply = () => {
    navigate("/immigration", { state: { website: selected } });
  };

  return (
    <XpWindow title="AgentPassport - Visa Application" icon="🌐">
      <p className="text-xs mb-3">
        Select a destination website ("country") for <b>{agent.name}</b> to visit. Each site has
        its own entry requirements.
      </p>

      <div className="space-y-2">
        {websites.map((site) => (
          <label
            key={site.name}
            className={`xp-panel flex items-start gap-3 p-3 cursor-pointer ${
              selected === site.name ? "border-2 border-xpblue-dark" : ""
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
