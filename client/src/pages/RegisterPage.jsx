import { useState } from "react";
import { useNavigate } from "react-router-dom";
import XpWindow from "../components/XpWindow.jsx";
import { api } from "../lib/api.js";

const PERMISSION_OPTIONS = [
  { id: "browse_web", label: "Browse the Web" },
  { id: "make_payments", label: "Make Payments" },
  { id: "post_content", label: "Post Content" },
  { id: "read_data", label: "Read Data" },
  { id: "delete_data", label: "Delete Data" },
  { id: "add_to_cart", label: "Add to Cart" },
];

export default function RegisterPage({ onRegistered }) {
  const navigate = useNavigate();
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
      setError("Please fill in all fields before applying for a passport.");
      return;
    }
    setLoading(true);
    try {
      const { agent } = await api.registerAgent({ ...form, requestedPermissions: permissions });
      onRegistered(agent);
      navigate("/passport");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <XpWindow title="AgentPassport - New Agent Registration" icon="📝">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <p className="bg-yellow-100 border border-yellow-400 text-yellow-900 text-xs p-2 rounded">
          Welcome, traveler! Please complete this form to apply for your AI Agent Passport.
        </p>

        <div>
          <label className="block font-bold mb-1">Agent Name</label>
          <input
            className="xp-input w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. ShopperBot 3000"
          />
        </div>

        <div>
          <label className="block font-bold mb-1">Creator</label>
          <input
            className="xp-input w-full"
            value={form.creator}
            onChange={(e) => setForm({ ...form, creator: e.target.value })}
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div>
          <label className="block font-bold mb-1">Purpose</label>
          <textarea
            className="xp-input w-full"
            rows={3}
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            placeholder="e.g. Assists customers with shopping and finding deals"
          />
        </div>

        <div>
          <label className="block font-bold mb-1">Requested Permissions</label>
          <div className="xp-panel p-3 grid grid-cols-2 gap-2">
            {PERMISSION_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={permissions.includes(opt.id)}
                  onChange={() => togglePermission(opt.id)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="bg-red-100 border border-red-400 text-red-800 text-xs p-2 rounded">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="submit" disabled={loading} className="xp-btn xp-btn-primary">
            {loading ? "Processing..." : "Apply for Passport →"}
          </button>
        </div>
      </form>
    </XpWindow>
  );
}
