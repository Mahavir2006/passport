// STUB: analyzeAgentPurpose()
//
// TODO(swap-for-real-llm): This function currently fakes an AI risk/permission
// analysis with keyword heuristics so the demo works without an API key.
// Replace the body with a real call to OpenAI/Gemini, e.g.:
//
//   const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       { role: "system", content: "You are an AI agent risk-assessment officer..." },
//       { role: "user", content: JSON.stringify({ name, creator, purpose, requestedPermissions }) },
//     ],
//     response_format: { type: "json_object" },
//   });
//   return JSON.parse(completion.choices[0].message.content);
//
// The return shape below (riskLevel, trustScore, grantedPermissions, spendingLimit,
// summary) must stay the same so callers in routes/agents.js don't need to change.
export function analyzeAgentPurpose({ name, creator, purpose, requestedPermissions }) {
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

  // AI "suggests" granted permissions as a subset of requested ones, trimming
  // anything that looks dangerous when risk is high.
  const dangerousPerms = ["delete_data", "make_payments", "admin_access"];
  const grantedPermissions = requestedPermissions.filter((perm) => {
    if (riskLevel === "high" && dangerousPerms.includes(perm)) return false;
    return true;
  });

  const spendingLimit = riskLevel === "low" ? 500 : riskLevel === "medium" ? 100 : 0;

  const summary = isRisky
    ? `Purpose statement contains high-risk indicators. Recommend limited permissions and manual review.`
    : isTrusted
    ? `Purpose statement aligns with common trusted agent use cases. Recommend standard permissions.`
    : `Purpose statement is ambiguous. Recommend moderate trust with restricted spending.`;

  return {
    riskLevel,
    trustScore,
    grantedPermissions,
    spendingLimit,
    summary,
  };
}
