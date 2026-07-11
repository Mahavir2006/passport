const BASE = "/api/agents";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  const data = await res.json();
  if (data.txHash && api.onTx) {
    api.onTx(data.txHash);
  }
  return data;
}

export const api = {
  onTx: null,
  registerAgent: (data) =>
    fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  getAgent: (id) => fetch(`${BASE}/${id}`).then(handle),

  listWebsites: () => fetch(`${BASE}/websites`).then(handle),

  applyForVisa: (id, website) =>
    fetch(`${BASE}/${id}/visa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website }),
    }).then(handle),

  getStamps: (id) => fetch(`${BASE}/${id}/stamps`).then(handle),

  simulateBehavior: (id, delta) =>
    fetch(`${BASE}/${id}/simulate-behavior`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    }).then(handle),

  listBlacklist: () => fetch(`${BASE}/blacklist/all`).then(handle),

  addBlacklistEntry: (data) =>
    fetch(`${BASE}/blacklist/all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Dispatch a Playwright agent task against a target URL.
  // body can include { targetUrl, loginPagePath, usernameSelector, passwordSelector, ... }
  // Returns { dispatchSessionId } — connect Socket.io to this session for live updates.
  dispatchAgentTask: (id, body) =>
    fetch(`${BASE}/${id}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(typeof body === "string" ? { targetUrl: body } : body),
    }).then(handle),
};
