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
import { saveCredentials, getCredentials } from "../credentialsStore.js";
import { runAgentTask } from "../agent-runner.js";

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

// POST /api/agents/visit — launches Playwright to click "Login with Agent" and add to cart
agentsRouter.post("/visit", async (req, res) => {
  const { url, agentId } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });

  try {
    const { chromium } = await import("playwright");

    // Fetch agent details to include in the verify-visa call so rift can log them
    let agentDetails = null;
    if (agentId) {
      try {
        const row = await getAgent(agentId);
        if (row) {
          const a = {
            ...row,
            requestedPermissions: JSON.parse(row.requestedPermissions || "[]"),
            grantedPermissions:   JSON.parse(row.grantedPermissions   || "[]"),
          };
          agentDetails = {
            agentId:     a.id,
            agentName:   a.name,
            creator:     a.creator,
            purpose:     a.purpose,
            trustScore:  a.trustScore,
            riskLevel:   a.riskLevel,
            grantedPermissions: a.grantedPermissions,
          };
        }
      } catch (_) { /* non-fatal — proceed without details */ }
    }

    const browser = await chromium.launch({ headless: false, slowMo: 400 });
    const page = await browser.newPage();

    // Intercept the /api/verify-visa request the rift page fires and inject agentDetails
    // This is the key wire: rift's verify-visa handler now receives the passport JSON
    if (agentDetails) {
      await page.route("**/api/verify-visa", async (route) => {
        const originalRequest = route.request();
        let originalBody = {};
        try {
          originalBody = JSON.parse(originalRequest.postData() || "{}");
        } catch (_) {}

        await route.continue({
          method: "POST",
          headers: { ...originalRequest.headers(), "content-type": "application/json" },
          postData: JSON.stringify({ ...originalBody, agentDetails }),
        });
      });
    }

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Click the "Login with Agent" button
    await page.click('button:has-text("Login with Agent"), a:has-text("Login with Agent")', { timeout: 8000 });

    // Wait for cart confirmation or post-login page
    let cartMessage = "Agent logged in and acted on " + new URL(url).hostname;
    try {
      await page.waitForSelector(
        '[data-testid="cart-toast"], .cart-toast, [data-testid="add-to-cart-btn"]',
        { timeout: 12000 }
      );
      const el = await page.$('[data-testid="cart-toast"], .cart-toast');
      if (el) cartMessage = (await el.textContent()).trim() || cartMessage;
      else cartMessage = "Item added to cart on " + new URL(url).hostname;
    } catch {
      // Likely redirected to /shop or another page — that's still a success
      const finalUrl = page.url();
      if (finalUrl.includes("/shop")) {
        cartMessage = "Agent successfully logged in — now on shop page";
      }
    }

    await browser.close();
    res.json({ reached: true, cartMessage, url });
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
    const analysis = await analyzeAgentPurpose({ name, creator, purpose, requestedPermissions: perms });

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

    // HACKATHON SHORTCUT: store credentials off-chain, in-memory only.
    // These are never written to the blockchain. See credentialsStore.js.
    const { username, password } = req.body;
    if (username && password) {
      saveCredentials(id, username, password);
    }

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

// POST /api/agents/register-url — fetch metadata from a real agent URL and register
agentsRouter.post("/register-url", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Agent URL is required" });
  }

  try {
    // 1. Fetch metadata from the real AI agent's endpoint
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch from agent URL. Status: ${response.status}` });
    }

    const metadata = await response.json();
    const { name, creator, purpose, requestedPermissions, performanceMetrics } = metadata;

    if (!name || !creator || !purpose) {
      return res.status(400).json({ error: "Fetched metadata is missing name, creator, or purpose." });
    }

    // 2. Analyze using ai.js, now passing performanceMetrics!
    const perms = Array.isArray(requestedPermissions) ? requestedPermissions : [];
    const analysis = await analyzeAgentPurpose({ name, creator, purpose, requestedPermissions: perms, performanceMetrics });

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

    // 3. Register on blockchain
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
      fetchedMetrics: performanceMetrics || null
    });
  } catch (error) {
    console.error("URL Registration error:", error);
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

// POST /api/agents/:id/verify-visa — called by mock-agent /login-agent to decide entry
// Returns the passport decision + linked credentials (server-to-server only, never exposed to browser clients)
agentsRouter.post("/:id/verify-visa", async (req, res) => {
  try {
    const row = await getAgentOr404(req, res);
    if (!row) return;

    const { websiteRules } = req.body;
    const agent = serializeAgent(row);
    const minTrust = websiteRules?.minTrustScore ?? 0;

    const blacklistMatch = await findBlacklistMatch(agent.name, agent.creator);
    if (agent.verificationStatus === "blacklisted" || blacklistMatch) {
      return res.json({ decision: "denied", reason: "Agent is blacklisted." });
    }

    if (agent.trustScore < minTrust) {
      return res.json({
        decision: "denied",
        reason: `Trust score ${agent.trustScore} is below required minimum (${minTrust}).`,
      });
    }

    // HACKATHON SHORTCUT: credentials are in-memory only, never on-chain.
    const creds = getCredentials(agent.id);

    res.json({
      decision: "approved",
      grantedPermissions: agent.grantedPermissions,
      // Only returned server-to-server for mock-agent use — never forwarded to the browser
      linkedUsername: creds?.username || null,
      linkedPassword: creds?.password || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agents/:id/dispatch — launch a Playwright agent task against a target URL
// Returns a dispatchSessionId the client can join via Socket.io to get live updates
agentsRouter.post("/:id/dispatch", async (req, res) => {
  try {
    const row = await getAgentOr404(req, res);
    if (!row) return;

    const {
      targetUrl,
      // Optional credential-login params — if omitted, uses /login-agent protocol
      loginPagePath,
      usernameSelector,
      passwordSelector,
      submitSelector,
      postLoginSelector,
    } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: "targetUrl is required" });
    }

    const agent = serializeAgent(row);
    const dispatchSessionId = `sess_${Date.now()}_${nanoid(8)}`;

    // Fire-and-forget: agent task runs async, emits Socket.io events
    runAgentTask({
      passportId: agent.id,
      targetUrl,
      purpose: agent.purpose,
      grantedPermissions: agent.grantedPermissions,
      dispatchSessionId,
      // Credential login fields (all optional — undefined = use /login-agent protocol)
      loginPagePath,
      usernameSelector,
      passwordSelector,
      submitSelector,
      postLoginSelector,
    }).then(async (result) => {
      // On success, write a stamp on-chain
      if (result.success) {
        try {
          await addStamp({
            id: `STP-${nanoid(8).toUpperCase()}`,
            agentId: agent.id,
            website: new URL(targetUrl).hostname,
            action: `Task completed: added "${result.item}" to cart ($${result.price})`,
            timestamp: nowIso(),
          });
          // Reward good behavior with a small trust bump
          const newScore = Math.min(100, agent.trustScore + 2);
          await updateTrustScore(agent.id, newScore, `Successful task at ${targetUrl}`);
        } catch (stampErr) {
          console.error("Failed to write stamp after task:", stampErr.message);
        }
      }
    }).catch((err) => {
      console.error("runAgentTask error:", err.message);
    });

    res.json({ dispatchSessionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agents/:id/task-result — explicit result report (optional, used by mock-agent callback)
agentsRouter.post("/:id/task-result", async (req, res) => {
  try {
    const row = await getAgentOr404(req, res);
    if (!row) return;

    const { status, item, targetUrl } = req.body;
    const agent = serializeAgent(row);

    if (status === "success" && item) {
      await addStamp({
        id: `STP-${nanoid(8).toUpperCase()}`,
        agentId: agent.id,
        website: targetUrl ? new URL(targetUrl).hostname : "unknown",
        action: `Task result: ${status} — item: ${item}`,
        timestamp: nowIso(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
