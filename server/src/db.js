import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Explicitly resolve the path and enable override to ensure changes in server/.env are loaded
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "AgentPassport.sol", "AgentPassport.json");

// Read ABI from the artifact
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

const provider = new JsonRpcProvider(process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology");
const wallet = new Wallet(process.env.AMOY_PRIVATE_KEY, provider);
export const contract = new Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

// Helper to get fresh nonce directly from the node without provider caching
async function getFreshNonce() {
  const hexCount = await provider.send("eth_getTransactionCount", [wallet.address, "latest"]);
  return parseInt(hexCount, 16);
}

// Map Solidity outputs to JS structures
function mapAgent(solAgent) {
  return {
    id: solAgent.id,
    name: solAgent.name,
    creator: solAgent.creator,
    purpose: solAgent.purpose,
    requestedPermissions: solAgent.requestedPermissions,
    grantedPermissions: solAgent.grantedPermissions,
    riskLevel: solAgent.riskLevel,
    trustScore: Number(solAgent.trustScore),
    spendingLimit: Number(solAgent.spendingLimit),
    verificationStatus: solAgent.verificationStatus,
    createdAt: solAgent.createdAt,
    exists: solAgent.exists
  };
}

// Visa mapping helper
function mapVisa(v) {
  return {
    id: v.id,
    agentId: v.agentId,
    website: v.website,
    status: v.status,
    reason: v.reason,
    issuedAt: v.issuedAt
  };
}

function mapStamp(s) {
  return {
    id: s.id,
    agentId: s.agentId,
    website: s.website,
    action: s.action,
    timestamp: s.timestamp
  };
}

function mapBlacklistEntry(b) {
  return {
    id: b.id,
    agentName: b.agentName || null,
    creator: b.creator || null,
    reason: b.reason,
    addedAt: b.addedAt
  };
}

// Database API wrapper functions mapping to blockchain
export async function getAgent(id) {
  try {
    const rawAgent = await contract.getAgent(id);
    return mapAgent(rawAgent);
  } catch (error) {
    if (error.message.includes("Agent does not exist") || error.message.includes("panic")) {
      return null;
    }
    return null;
  }
}

export async function getAllAgents() {
  try {
    const ids = await contract.getAllAgentIds();
    const list = [];
    for (const id of ids) {
      const agent = await getAgent(id);
      if (agent) list.push(agent);
    }
    return list;
  } catch (error) {
    console.error("Error fetching all agents:", error);
    return [];
  }
}

export async function registerAgent(agentData) {
  const agentStruct = {
    id: agentData.id,
    name: agentData.name,
    creator: agentData.creator,
    purpose: agentData.purpose,
    requestedPermissions: JSON.stringify(agentData.requestedPermissions),
    grantedPermissions: JSON.stringify(agentData.grantedPermissions),
    riskLevel: agentData.riskLevel,
    trustScore: agentData.trustScore,
    spendingLimit: agentData.spendingLimit,
    verificationStatus: agentData.verificationStatus,
    createdAt: agentData.createdAt,
    exists: true
  };
  const nonce = await getFreshNonce();
  const tx = await contract.registerAgent(agentStruct, { nonce });
  await tx.wait();
  return getAgent(agentData.id);
}

export async function updateTrustScore(id, trustScore, reason) {
  const nonce = await getFreshNonce();
  const tx = await contract.updateTrustScore(id, trustScore, reason, { nonce });
  await tx.wait();
  return getAgent(id);
}

export async function updateVerificationStatus(id, status) {
  const nonce = await getFreshNonce();
  const tx = await contract.updateVerificationStatus(id, status, { nonce });
  await tx.wait();
  return getAgent(id);
}

export async function addVisa(visaData) {
  const nonce = await getFreshNonce();
  const tx = await contract.addVisa({
    id: visaData.id,
    agentId: visaData.agentId,
    website: visaData.website,
    status: visaData.status,
    reason: visaData.reason,
    issuedAt: visaData.issuedAt
  }, { nonce });
  await tx.wait();
  return visaData;
}

export async function getVisas(agentId) {
  try {
    const list = await contract.getVisas(agentId);
    return list.map(mapVisa);
  } catch (error) {
    return [];
  }
}

export async function addStamp(stampData) {
  const nonce = await getFreshNonce();
  const tx = await contract.addStamp({
    id: stampData.id,
    agentId: stampData.agentId,
    website: stampData.website,
    action: stampData.action,
    timestamp: stampData.timestamp
  }, { nonce });
  await tx.wait();
  return stampData;
}

export async function getStamps(agentId) {
  try {
    const list = await contract.getStamps(agentId);
    return list.map(mapStamp);
  } catch (error) {
    return [];
  }
}

export async function getBlacklist() {
  try {
    const list = await contract.getBlacklist();
    return list.map(mapBlacklistEntry);
  } catch (error) {
    console.error("Error fetching blacklist:", error);
    return [];
  }
}

export async function addToBlacklist(entry, overrides = {}) {
  const nonce = await getFreshNonce();
  const tx = await contract.addToBlacklist({
    id: entry.id,
    agentName: entry.agentName || "",
    creator: entry.creator || "",
    reason: entry.reason,
    addedAt: entry.addedAt
  }, { nonce, ...overrides });
  await tx.wait();
  return entry;
}

export function nowIso() {
  return new Date().toISOString();
}

export async function findBlacklistMatch(name, creator) {
  const rows = await getBlacklist();
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
