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

const provider = new JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
const wallet = new Wallet(process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
export const contract = new Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

// Helper to get fresh nonce directly from the node without provider caching
// Removed manual nonce management - ethers Wallet handles concurrent nonces natively

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
  const tx = await contract.registerAgent(agentStruct);
  await tx.wait();
  const agent = await getAgent(agentData.id);
  return { ...agent, txHash: tx.hash };
}

export async function updateTrustScore(id, trustScore, reason) {
  const tx = await contract.updateTrustScore(id, trustScore, reason);
  await tx.wait();
  const agent = await getAgent(id);
  return { ...agent, txHash: tx.hash };
}

export async function updateVerificationStatus(id, status) {
  const tx = await contract.updateVerificationStatus(id, status);
  await tx.wait();
  const agent = await getAgent(id);
  return { ...agent, txHash: tx.hash };
}

export async function addVisa(visaData) {
  const tx = await contract.addVisa({
    id: visaData.id,
    agentId: visaData.agentId,
    website: visaData.website,
    status: visaData.status,
    reason: visaData.reason,
    issuedAt: visaData.issuedAt
  });
  await tx.wait();
  return { ...visaData, txHash: tx.hash };
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
  const tx = await contract.addStamp({
    id: stampData.id,
    agentId: stampData.agentId,
    website: stampData.website,
    action: stampData.action,
    timestamp: stampData.timestamp
  });
  await tx.wait();
  return { ...stampData, txHash: tx.hash };
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
  const tx = await contract.addToBlacklist({
    id: entry.id,
    agentName: entry.agentName || "",
    creator: entry.creator || "",
    reason: entry.reason,
    addedAt: entry.addedAt
  }, overrides);
  await tx.wait();
  return { ...entry, txHash: tx.hash };
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
