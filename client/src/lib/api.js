const BASE = "/api/agents";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
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
};
