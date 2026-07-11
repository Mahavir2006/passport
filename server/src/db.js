import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "agentpassport.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    creator TEXT NOT NULL,
    purpose TEXT NOT NULL,
    requestedPermissions TEXT NOT NULL,
    grantedPermissions TEXT NOT NULL,
    riskLevel TEXT NOT NULL,
    trustScore INTEGER NOT NULL,
    spendingLimit INTEGER NOT NULL,
    verificationStatus TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visas (
    id TEXT PRIMARY KEY,
    agentId TEXT NOT NULL,
    website TEXT NOT NULL,
    status TEXT NOT NULL,
    reason TEXT NOT NULL,
    issuedAt TEXT NOT NULL,
    FOREIGN KEY (agentId) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS stamps (
    id TEXT PRIMARY KEY,
    agentId TEXT NOT NULL,
    website TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (agentId) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS blacklist (
    id TEXT PRIMARY KEY,
    agentName TEXT,
    creator TEXT,
    reason TEXT NOT NULL,
    addedAt TEXT NOT NULL
  );
`);

// Seed a few known-bad demo entries so the blacklist has something to show
// out of the box. Matched case-insensitively against agentName/creator at
// registration and visa time.
const blacklistSeed = [
  { agentName: "ScrapeMaster", creator: "DarkNet Bots Inc", reason: "Repeated unauthorized data scraping across partner sites." },
  { agentName: "SpamKing3000", creator: null, reason: "Flagged for mass spam posting campaigns." },
  { agentName: null, creator: "Fraudulent Ventures LLC", reason: "Creator associated with prior payment fraud incidents." },
];

const blacklistCount = db.prepare("SELECT COUNT(*) AS c FROM blacklist").get().c;
if (blacklistCount === 0) {
  const insertBlacklist = db.prepare(
    `INSERT INTO blacklist (id, agentName, creator, reason, addedAt) VALUES (?, ?, ?, ?, ?)`
  );
  for (const entry of blacklistSeed) {
    insertBlacklist.run(
      `BL-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      entry.agentName,
      entry.creator,
      entry.reason,
      new Date().toISOString()
    );
  }
}

// Demo "websites" acting as countries, each with entry rules.
export const WEBSITES = {
  "ShopSite.com": {
    name: "ShopSite.com",
    category: "shopping",
    description: "E-commerce marketplace for autonomous shopping agents.",
    allowedPurposeKeywords: ["shop", "purchase", "buy", "cart", "commerce", "order"],
    minTrustScore: 40,
  },
  "SocialHub.com": {
    name: "SocialHub.com",
    category: "social",
    description: "Social network for posting, commenting, and messaging.",
    allowedPurposeKeywords: ["social", "post", "comment", "message", "chat", "content"],
    minTrustScore: 55,
  },
  "DataVault.com": {
    name: "DataVault.com",
    category: "data",
    description: "Sensitive data storage and analytics platform.",
    allowedPurposeKeywords: ["data", "analytics", "research", "scrape", "aggregate"],
    minTrustScore: 70,
  },
  "NewsWire.com": {
    name: "NewsWire.com",
    category: "content",
    description: "News aggregation and summarization portal.",
    allowedPurposeKeywords: ["news", "summarize", "content", "aggregate", "research"],
    minTrustScore: 30,
  },
};

export function nowIso() {
  return new Date().toISOString();
}

// Checks whether a given agent name / creator matches any blacklist entry
// (case-insensitive). Returns the matching row, or null if clean.
export function findBlacklistMatch(name, creator) {
  const rows = db.prepare("SELECT * FROM blacklist").all();
  const nameLower = (name || "").toLowerCase();
  const creatorLower = (creator || "").toLowerCase();

  return (
    rows.find((row) => {
      const nameMatch = row.agentName && row.agentName.toLowerCase() === nameLower;
      const creatorMatch = row.creator && row.creator.toLowerCase() === creatorLower;
      return nameMatch || creatorMatch;
    }) || null
  );
}
