import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "AgentPassport.sol", "AgentPassport.json");

async function main() {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const provider = new JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
  const wallet = new Wallet(process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

  console.log("Deploying contract from:", wallet.address);

  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();

  console.log("Transaction sent. Waiting for deployment block confirmation...");
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`AgentPassport deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
