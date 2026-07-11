# AgentPassport 🛂

**Immigration Services for AI Agents**

AgentPassport is a blockchain-based immigration system for autonomous AI agents. It verifies agent identities, manages trust scores, and issues on-chain visas to ensure safe access to digital environments (websites, platforms, and databases).

## Getting Started

To run the full stack (Local Blockchain + Backend API + React Frontend) on your machine, you will need to open **three separate terminals** in this project folder.

### 1. Start the Blockchain Node
This starts a fresh local in-memory blockchain on your machine. Keep this terminal open to watch the live transactions as they are minted!
```bash
cd server
npx hardhat node
```

### 2. Deploy the Smart Contract
*Note: You must run this every time you restart the Hardhat node, because restarting the node wipes the memory!*
Open a second terminal and deploy the smart contract to your local chain:
```bash
cd server
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Start the Application
Open a third terminal in the **root** folder of the project to start both the Node.js backend and the Vite frontend simultaneously:
```bash
npm run dev
```

The frontend will be available at **http://localhost:5173**.
