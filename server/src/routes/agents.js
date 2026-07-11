import { Router } from "express";
import { nanoid } from "nanoid";
import { db, WEBSITES, nowIso, findBlacklistMatch } from "../db.js";
import { analyzeAgentPurpose } from "../ai.js";

export const agentsRouter = Router();

function serializeAgent(row) {
  return {
    ...row,
    requestedPermissions: JSON.parse(row.requestedPermissions),
    grantedPermissions: JSON.parse(row.grantedPermissions),
  };
}

function getAgentOr404(req, res) {
  const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(req.params.id);
  if (!row) {
    res.status(404).json({ error: "Agent not found" });
    return null;
  }
  return row;
}

// GET /api/agents/websites — list demo websites (registered before /:id to avoid path clash)
agentsRouter.get("/websites", (req, res) => {
  res.json(Object.values(WEBSITES));
});

// Blacklist admin routes — also registered before /:id to avoid path clash
agentsRouter.get("/blacklist/all", (req, res) => {
  const rows = db.prepare("SELECT * FROM blacklist ORDER BY addedAt DESC").all();
  res.json(rows);
});

agentsRouter.post("/blacklist/all", (req, res) => {
  const { agentName, creator, reason } = req.body;

  if (!agentName && !creator) {
    return res.status(400).json({ error: "Provide at least an agentName or creator to blacklist" });
  }
  if (!reason) {
    return res.status(400).json({ error: "reason is required" });
  }

  const id = `BL-${nanoid(8).toUpperCase()}`;
  const addedAt = nowIso();
  db.prepare(
    `INSERT INTO blacklist (id, agentName, creator, reason, addedAt) VALUES (?, ?, ?, ?, ?)`
  ).run(id, agentName || null, creator || null, reason, addedAt);

  const matches = db.prepare("SELECT * FROM agents").all().filter((a) => {
    const nameMatch = agentName && a.name.toLowerCase() === agentName.toLowerCase();
    const creatorMatch = creator && a.creator.toLowerCase() === creator.toLowerCase();
    return nameMatch || creatorMatch;
  });
  for (const match of matches) {
    db.prepare("UPDATE agents SET verificationStatus = 'blacklisted' WHERE id = ?").run(match.id);
  }

  res.status(201).json({
    entry: { id, agentName, creator, reason, addedAt },
    flaggedAgentIds: matches.map((m) => m.id),
  });
});

// POST /api/agents — register agent, analyze purpose, generate passport
agentsRouter.post("/", (req, res) => {
  const { name, creator, purpose, requestedPermissions } = req.body;

  if (!name || !creator || !purpose) {
    return res.status(400).json({ error: "name, creator, and purpose are required" });
  }

  const perms = Array.isArray(requestedPermissions) ? requestedPermissions : [];
  const analysis = analyzeAgentPurpose({ name, creator, purpose, requestedPermissions: perms });

  const id = `AGT-${nanoid(8).toUpperCase()}`;
  const createdAt = nowIso();

  const blacklistMatch = findBlacklistMatch(name, creator);

  let verificationStatus = analysis.riskLevel === "high" ? "pending" : "verified";
  let trustScore = analysis.trustScore;
  let grantedPermissions = analysis.grantedPermissions;

  if (blacklistMatch) {
    verificationStatus = "blacklisted";
    trustScore = Math.min(trustScore, 5);
    grantedPermissions = [];
  }

  db.prepare(
    `INSERT INTO agents
      (id, name, creator, purpose, requestedPermissions, grantedPermissions, riskLevel, trustScore, spendingLimit, verificationStatus, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    creator,
    purpose,
    JSON.stringify(perms),
    JSON.stringify(grantedPermissions),
    analysis.riskLevel,
    trustScore,
    blacklistMatch ? 0 : analysis.spendingLimit,
    verificationStatus,
    createdAt
  );

  const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  res.status(201).json({
    agent: serializeAgent(row),
    analysis,
    blacklistMatch: blacklistMatch ? { reason: blacklistMatch.reason } : null,
  });
});

// GET /api/agents/:id — fetch passport
agentsRouter.get("/:id", (req, res) => {
  const row = getAgentOr404(req, res);
  if (!row) return;
  res.json(serializeAgent(row));
});

// POST /api/agents/:id/visa — apply for visa to a demo website
agentsRouter.post("/:id/visa", (req, res) => {
  const row = getAgentOr404(req, res);
  if (!row) return;

  const { website } = req.body;
  const site = WEBSITES[website];
  if (!site) {
    return res.status(400).json({ error: `Unknown website "${website}"` });
  }

  const agent = serializeAgent(row);
  const blacklistMatch = findBlacklistMatch(agent.name, agent.creator);

  if (agent.verificationStatus === "blacklisted" || blacklistMatch) {
    const reason = blacklistMatch
      ? `Agent is blacklisted: ${blacklistMatch.reason}`
      : "Agent is blacklisted.";
    if (agent.verificationStatus !== "blacklisted") {
      db.prepare("UPDATE agents SET verificationStatus = 'blacklisted' WHERE id = ?").run(agent.id);
    }
    return res.json(recordVisa(agent.id, website, "denied", reason));
  }

  const purposeLower = agent.purpose.toLowerCase();
  const purposeMatches = site.allowedPurposeKeywords.some((k) => purposeLower.includes(k));
  const trustOk = agent.trustScore >= site.minTrustScore;

  let status, reason;
  if (trustOk && purposeMatches) {
    status = "approved";
    reason = `Trust score ${agent.trustScore} meets minimum (${site.minTrustScore}) and purpose matches ${site.category} category.`;
  } else if (!trustOk) {
    status = "denied";
    reason = `Trust score ${agent.trustScore} is below required minimum (${site.minTrustScore}) for ${website}.`;
  } else {
    status = "denied";
    reason = `Stated purpose does not match ${website}'s allowed categories (${site.category}).`;
  }

  const result = recordVisa(agent.id, website, status, reason);

  if (status === "approved") {
    db.prepare(
      `INSERT INTO stamps (id, agentId, website, action, timestamp) VALUES (?, ?, ?, ?, ?)`
    ).run(`STP-${nanoid(8).toUpperCase()}`, agent.id, website, "Entry granted", nowIso());
  }

  res.json(result);
});

function recordVisa(agentId, website, status, reason) {
  const id = `VISA-${nanoid(8).toUpperCase()}`;
  const issuedAt = nowIso();
  db.prepare(
    `INSERT INTO visas (id, agentId, website, status, reason, issuedAt) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, agentId, website, status, reason, issuedAt);
  return { id, agentId, website, status, reason, issuedAt };
}

// GET /api/agents/:id/stamps — activity log
agentsRouter.get("/:id/stamps", (req, res) => {
  const row = getAgentOr404(req, res);
  if (!row) return;
  const stamps = db
    .prepare("SELECT * FROM stamps WHERE agentId = ? ORDER BY timestamp DESC")
    .all(req.params.id);
  const visas = db
    .prepare("SELECT * FROM visas WHERE agentId = ? ORDER BY issuedAt DESC")
    .all(req.params.id);
  res.json({ stamps, visas });
});

// POST /api/agents/:id/simulate-behavior — dev-only trust score bump
agentsRouter.post("/:id/simulate-behavior", (req, res) => {
  const row = getAgentOr404(req, res);
  if (!row) return;

  const { delta } = req.body;
  const change = Number.isFinite(delta) ? delta : 0;

  const newScore = Math.max(0, Math.min(100, row.trustScore + change));
  const explicitlyBlacklisted = findBlacklistMatch(row.name, row.creator) !== null;

  let verificationStatus = row.verificationStatus;
  if (newScore <= 10 || explicitlyBlacklisted) verificationStatus = "blacklisted";
  else if (verificationStatus === "blacklisted" && newScore > 10) verificationStatus = "verified";

  db.prepare("UPDATE agents SET trustScore = ?, verificationStatus = ? WHERE id = ?").run(
    newScore,
    verificationStatus,
    row.id
  );

  const updated = db.prepare("SELECT * FROM agents WHERE id = ?").get(row.id);
  res.json(serializeAgent(updated));
});
