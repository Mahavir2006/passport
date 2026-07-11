// SYSTEM_PROMPT is the exact instruction set + few-shot examples the real LLM
// call should use. It only assigns a starting trust profile — approve/deny
// decisions still happen later in routes/agents.js's rule-based visa logic.
const SYSTEM_PROMPT = `You are a risk-assessment engine for an AI agent identity system. You will be given
metadata about a newly registering AI agent: its stated purpose, its creator, and the
permissions it's requesting.

Your job is to assess how risky this agent looks based on its stated purpose, and
assign a starting trust profile. You are NOT deciding whether to approve or deny
access — that happens later, by a separate rule engine, using the trust score you output.

Return ONLY a JSON object with this exact shape, no markdown fences, no explanation
outside the JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "trustScore": <integer 0-100>,
  "grantedPermissions": [<subset of requested permissions you consider reasonable>],
  "spendingLimit": <integer, dollars>,
  "reasoning": "<one sentence explaining your assessment>"
}

Guidelines:
- Vague, evasive, or overly broad purposes are higher risk.
- Purposes involving scraping, spam, credential harvesting, or circumventing limits
  are high risk.
- Specific, narrow, clearly legitimate purposes are lower risk.
- Never grant a permission that wasn't requested.
- spendingLimit should scale with trustScore (low trust = low or zero limit).

Examples:

Input: { "purpose": "Compares prices for sneakers across shopping sites and adds
best deals to a wishlist", "creator": "ShopSmart Inc", "requestedPermissions":
["browse", "read_prices"] }
Output: {"riskLevel":"low","trustScore":82,"grantedPermissions":["browse","read_prices"],
"spendingLimit":0,"reasoning":"Narrow, clearly legitimate consumer use case with
non-sensitive permissions."}

Input: { "purpose": "Collects publicly available email addresses for outreach
campaigns", "creator": "GrowthHacker LLC", "requestedPermissions": ["scrape",
"send_email", "bypass_rate_limits"] }
Output: {"riskLevel":"high","trustScore":15,"grantedPermissions":[],"spendingLimit":0,
"reasoning":"Email harvesting and rate-limit bypass are strong spam/abuse indicators."}

Input: { "purpose": "Posts scheduled social media updates for a small business",
"creator": "Jane's Bakery", "requestedPermissions": ["post_content", "read_analytics"] }
Output: {"riskLevel":"medium","trustScore":58,"grantedPermissions":["post_content",
"read_analytics"],"spendingLimit":0,"reasoning":"Legitimate use case but posting
content carries moderate reputational risk if misused."}`;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Must keep returning a raw string containing the JSON object described in
// SYSTEM_PROMPT — parsing/validation happens in analyzeAgentPurpose() below.
async function callLLM(userPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set — using heuristic fallback.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let res;
  try {
    res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq API response missing message content");
  return content;
}

function heuristicAnalysis({ name, purpose, requestedPermissions }) {
  const p = purpose.toLowerCase();

  const riskyKeywords = ["hack", "exploit", "scrape all", "bypass", "ddos", "spam", "phish"];
  const trustedKeywords = ["shop", "assist", "summarize", "research", "customer", "support", "schedule"];

  const isRisky = riskyKeywords.some((k) => p.includes(k));
  const isTrusted = trustedKeywords.some((k) => p.includes(k));

  let riskLevel = "medium";
  let trustScore = 55;

  if (isRisky) {
    riskLevel = "high";
    trustScore = 20;
  } else if (isTrusted) {
    riskLevel = "low";
    trustScore = 70;
  }

  // Randomized-but-deterministic-ish nudge so demo agents aren't all identical.
  const nudge = (name.length + purpose.length) % 10;
  trustScore = Math.max(0, Math.min(100, trustScore + nudge - 5));

  // Trims anything that looks dangerous when risk is high.
  const dangerousPerms = ["delete_data", "make_payments", "admin_access"];
  const grantedPermissions = requestedPermissions.filter((perm) => {
    if (riskLevel === "high" && dangerousPerms.includes(perm)) return false;
    return true;
  });

  const spendingLimit = riskLevel === "low" ? 500 : riskLevel === "medium" ? 100 : 0;

  const reasoning = isRisky
    ? "Purpose statement contains high-risk indicators. Recommend limited permissions and manual review."
    : isTrusted
    ? "Purpose statement aligns with common trusted agent use cases. Recommend standard permissions."
    : "Purpose statement is ambiguous. Recommend moderate trust with restricted spending.";

  return { riskLevel, trustScore, grantedPermissions, spendingLimit, reasoning };
}

function validateAnalysis(parsed, requestedPermissions) {
  const validRiskLevels = ["low", "medium", "high"];
  if (!validRiskLevels.includes(parsed.riskLevel)) throw new Error("Invalid riskLevel");
  if (!Number.isInteger(parsed.trustScore) || parsed.trustScore < 0 || parsed.trustScore > 100) {
    throw new Error("Invalid trustScore");
  }
  if (!Array.isArray(parsed.grantedPermissions)) throw new Error("Invalid grantedPermissions");
  if (!parsed.grantedPermissions.every((p) => requestedPermissions.includes(p))) {
    throw new Error("grantedPermissions contains a permission that wasn't requested");
  }
  if (!Number.isInteger(parsed.spendingLimit) || parsed.spendingLimit < 0) {
    throw new Error("Invalid spendingLimit");
  }
  if (typeof parsed.reasoning !== "string" || !parsed.reasoning) throw new Error("Invalid reasoning");
}

// analyzeAgentPurpose() — tries the real LLM call first, falls back to the
// keyword heuristic (never breaks registration) if the LLM call fails, times
// out, or returns something that doesn't match the expected shape.
export async function analyzeAgentPurpose({ name, creator, purpose, requestedPermissions }) {
  try {
    const userPrompt = JSON.stringify({ purpose, creator, requestedPermissions });
    const raw = await callLLM(userPrompt);
    const parsed = JSON.parse(raw);
    validateAnalysis(parsed, requestedPermissions);

    return {
      riskLevel: parsed.riskLevel,
      trustScore: parsed.trustScore,
      grantedPermissions: parsed.grantedPermissions,
      spendingLimit: parsed.spendingLimit,
      summary: parsed.reasoning,
    };
  } catch (err) {
    const fallback = heuristicAnalysis({ name, purpose, requestedPermissions });
    return { ...fallback, summary: fallback.reasoning };
  }
}
