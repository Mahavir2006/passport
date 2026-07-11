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
  
  const provider = new JsonRpcProvider(process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology");
  const wallet = new Wallet(process.env.AMOY_PRIVATE_KEY, provider);

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
