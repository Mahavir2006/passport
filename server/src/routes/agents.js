import { Router } from "express";
import { nanoid } from "nanoid";
import {
  getAgent,
  getAllAgents,
  registerAgent,
  updateTrustScore,
  updateVerificationStatus,
  addVisa,
  getVisas,
  addStamp,
  getStamps,
  getBlacklist,
  addToBlacklist,
  findBlacklistMatch,
  WEBSITES,
  nowIso
} from "../db.js";
import { analyzeAgentPurpose } from "../ai.js";

export const agentsRouter = Router();

function serializeAgent(row) {
  if (!row) return null;
  return {
    ...row,
    requestedPermissions: JSON.parse(row.requestedPermissions || "[]"),
    grantedPermissions: JSON.parse(row.grantedPermissions || "[]"),
  };
}

async function getAgentOr404(req, res) {
  const row = await getAgent(req.params.id);
  if (!row) {
    res.status(404).json({ error: "Agent not found" });
    return null;
  }
  return row;
}

// GET /api/agents/websites — list demo websites
agentsRouter.get("/websites", (req, res) => {
  res.json(Object.values(WEBSITES));
});

// POST /api/agents/visit — agent visits a custom URL, confirms reachability
agentsRouter.post("/visit", async (req, res) => {
  const { url, agentId } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": `AgentPassport-Agent/${agentId || "unknown"}` },
    });
    res.json({ reached: true, status: response.status, url });
  } catch (err) {
    res.json({ reached: false, error: err.message, url });
  }
});

// Blacklist admin routes
agentsRouter.get("/blacklist/all", async (req, res) => {
  try {
    const rows = await getBlacklist();
    // Sort descending by addedAt
    const sorted = [...rows].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

agentsRouter.post("/blacklist/all", async (req, res) => {
  const { agentName, creator, reason } = req.body;

  if (!agentName && !creator) {
    return res.status(400).json({ error: "Provide at least an agentName or creator to blacklist" });
  }
  if (!reason) {
    return res.status(400).json({ error: "reason is required" });
  }

  try {
    const id = `BL-${nanoid(8).toUpperCase()}`;
    const addedAt = nowIso();

    const blacklistResult = await addToBlacklist({
      id,
      agentName: agentName || "",
      creator: creator || "",
      reason,
      addedAt
    });

    const allAgents = await getAllAgents();
    const matches = allAgents.filter((a) => {
      const nameMatch = agentName && a.name.toLowerCase() === agentName.toLowerCase();
      const creatorMatch = creator && a.creator.toLowerCase() === creator.toLowerCase();
      return nameMatch || creatorMatch;
    });

    for (const match of matches) {
      await updateVerificationStatus(match.id, "blacklisted");
    }

    res.status(201).json({
      entry: { id, agentName, creator, reason, addedAt },
      flaggedAgentIds: matches.map((m) => m.id),
      txHash: blacklistResult.txHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agents — register agent, analyze purpose, generate passport
agentsRouter.post("/", async (req, res) => {
  const { name, creator, purpose, requestedPermissions } = req.body;

  if (!name || !creator || !purpose) {
    return res.status(400).json({ error: "name, creator, and purpose are required" });
  }

  try {
    const perms = Array.isArray(requestedPermissions) ? requestedPermissions : [];
    const analysis = analyzeAgentPurpose({ name, creator, purpose, requestedPermissions: perms });

    const id = `AGT-${nanoid(8).toUpperCase()}`;
    const createdAt = nowIso();

    const blacklistMatch = await findBlacklistMatch(name, creator);

    let verificationStatus = analysis.riskLevel === "high" ? "pending" : "verified";
    let trustScore = analysis.trustScore;
    let grantedPermissions = analysis.grantedPermissions;

    if (blacklistMatch) {
      verificationStatus = "blacklisted";
      trustScore = Math.min(trustScore, 5);
      grantedPermissions = [];
    }

    const registered = await registerAgent({
      id,
      name,
      creator,
      purpose,
      requestedPermissions: perms,
      grantedPermissions,
      riskLevel: analysis.riskLevel,
      trustScore,
      spendingLimit: blacklistMatch ? 0 : analysis.spendingLimit,
      verificationStatus,
      createdAt
    });

    res.status(201).json({
      agent: serializeAgent(registered),
      analysis,
      blacklistMatch: blacklistMatch ? { reason: blacklistMatch.reason } : null,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/agents/:id — fetch passport
agentsRouter.get("/:id", async (req, res) => {
  try {
    const row = await getAgentOr404(req, res);
    if (!row) return;
    res.json(serializeAgent(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agents/:id/visa — apply for visa to a demo website
agentsRouter.post("/:id/visa", async (req, res) => {
  try {
    const row = await getAgentOr404(req, res);
    if (!row) return;

    const { website } = req.body;
    const site = WEBSITES[website];
    if (!site) {
      return res.status(400).json({ error: `Unknown website "${website}"` });
    }

    const agent = serializeAgent(row);
    const blacklistMatch = await findBlacklistMatch(agent.name, agent.creator);

    if (agent.verificationStatus === "blacklisted" || blacklistMatch) {
      const reason = blacklistMatch
        ? `Agent is blacklisted: ${blacklistMatch.reason}`
        : "Agent is blacklisted.";
      if (agent.verificationStatus !== "blacklisted") {
        await updateVerificationStatus(agent.id, "blacklisted");
      }
      const recorded = await recordVisa(agent.id, website, "denied", reason);
      return res.json(recorded);
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

    const result = await recordVisa(agent.id, website, status, reason);

    if (status === "approved") {
      const stampResult = await addStamp({
        id: `STP-${nanoid(8).toUpperCase()}`,
        agentId: agent.id,
        website,
        action: "Entry granted",
        timestamp: nowIso()
      });
      result.txHash = stampResult.txHash;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function recordVisa(agentId, website, status, reason) {
  const id = `VISA-${nanoid(8).toUpperCase()}`;
  const issuedAt = nowIso();
  const visaResult = await addVisa({
    id,
    agentId,
    website,
    status,
    reason,
    issuedAt
  });
  return visaResult;
}

// GET /api/agents/:id/stamps — activity log
agentsRouter.get("/:id/stamps", async (req, res) => {
  try {
    const row = await getAgentOr404(req, res);
    if (!row) return;
    const stamps = await getStamps(req.params.id);
    const visas = await getVisas(req.params.id);
    // Sort
    const sortedStamps = [...stamps].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const sortedVisas = [...visas].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    res.json({ stamps: sortedStamps, visas: sortedVisas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agents/:id/simulate-behavior — dev-only trust score bump
agentsRouter.post("/:id/simulate-behavior", async (req, res) => {
  try {
    const row = await getAgentOr404(req, res);
    if (!row) return;

    const { delta } = req.body;
    const change = Number.isFinite(delta) ? delta : 0;

    const newScore = Math.max(0, Math.min(100, row.trustScore + change));
    const explicitlyBlacklisted = (await findBlacklistMatch(row.name, row.creator)) !== null;

    let verificationStatus = row.verificationStatus;
    if (newScore <= 10 || explicitlyBlacklisted) {
      verificationStatus = "blacklisted";
    } else if (verificationStatus === "blacklisted" && newScore > 10) {
      verificationStatus = "verified";
    }

    // Submit trust score update on-chain
    const trustResult = await updateTrustScore(row.id, newScore, `Behavior simulated with delta ${change}`);
    let txHash = trustResult.txHash;

    if (verificationStatus !== row.verificationStatus) {
      const verifResult = await updateVerificationStatus(row.id, verificationStatus);
      txHash = verifResult.txHash;
    }

    const updated = await getAgent(row.id);
    res.json({ ...serializeAgent(updated), txHash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
