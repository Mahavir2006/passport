# AgentPassport — Blockchain Workflow (Polygon Amoy)
### Using Polygon Amoy Testnet Instead of a Traditional Database

---

## 1. Why Polygon Amoy?

Polygon Amoy is Polygon's official testnet (replacing the old Mumbai testnet). We're using it because:
- **Free** — test tokens (test-MATIC/POL) are given out by faucets, no real money needed
- **Fast & cheap** — low gas fees, quick confirmations, good for live demos
- **EVM-compatible** — works with standard Ethereum tools (Solidity, Hardhat, MetaMask, ethers.js)
- **Reliable for hackathons** — widely supported, active faucets, good RPC uptime

---

## 2. What Changes vs. the Original Plan

| Original Plan (Database) | New Plan (Blockchain) |
|---|---|
| MongoDB / Supabase stores passport data | Smart contract on Polygon Amoy stores passport data |
| Backend directly writes/reads DB | Backend calls smart contract via ethers.js |
| Trust score = a number in a DB row | Trust score = a number in contract storage, updated via transactions |
| Approval = DB flag change | Approval = an on-chain transaction (visible on PolygonScan) |
| No public proof of history | Every stamp/trust change is a permanent, publicly verifiable transaction |

**Key idea:** the blockchain *becomes* your database. Instead of `INSERT INTO passports...`, you call a smart contract function that stores the data on-chain.

---

## 3. What Data Goes On-Chain vs Off-Chain

Blockchain storage is small and costs gas per byte, so we split data smartly:

### Stored ON-CHAIN (in the smart contract)
- Agent ID (wallet address or unique hash)
- Trust Score (number)
- Verification Status (bool)
- Spending Limit (number)
- Passport issue timestamp
- Stamp count / stamp hashes (per visa approval)
- Blacklist flag

### Stored OFF-CHAIN (in IPFS, or a lightweight JSON file — optional but recommended)
- Agent name, creator, purpose (longer text fields)
- Full activity logs / descriptions
- Profile image/icon
- Any large metadata

→ The off-chain data gets a hash (via IPFS or similar), and **only that hash is stored on-chain** — this is the same pattern real NFT metadata uses. It keeps gas costs low while still being "blockchain-backed" since the hash on-chain proves the off-chain data hasn't been tampered with.

*(If you want to keep it fully simple for the hackathon, you can skip IPFS and just store everything short directly on-chain — see Section 6, Simplified MVP Option.)*

---

## 4. High-Level Architecture

```
┌─────────────────┐        ┌──────────────────┐        ┌────────────────────┐
│   Frontend       │──────▶│   Backend (Node)   │──────▶│  Smart Contract     │
│  (React + XP UI) │◀──────│  Express + ethers.js│◀──────│  on Polygon Amoy    │
└─────────────────┘        └──────────────────┘        └────────────────────┘
                                     │
                                     ▼
                            (Optional) IPFS for
                            large metadata storage
```

- **Frontend** never talks to the blockchain directly (simpler for a demo) — it calls your backend
- **Backend** holds a wallet (private key in `.env`) and signs transactions on behalf of the app
- **Smart Contract** is the "database" — deployed once on Polygon Amoy, backend calls its functions

---

## 5. Smart Contract Design

Write this in **Solidity**. Core structure:

```solidity
struct Passport {
    string agentName;
    string purpose;
    uint256 trustScore;
    uint256 spendingLimit;
    bool isVerified;
    bool isBlacklisted;
    uint256 stampCount;
    uint256 issuedAt;
}

mapping(address => Passport) public passports;

function registerAgent(string memory name, string memory purpose) public { ... }
function updateTrustScore(address agent, int256 change) public { ... }
function issueVisaStamp(address agent, string memory websiteName) public { ... }
function blacklistAgent(address agent) public { ... }
function getPassport(address agent) public view returns (Passport memory) { ... }
```

Each of these functions maps directly to a feature in your app:

| App Feature | Smart Contract Function |
|---|---|
| Register Agent | `registerAgent()` |
| Generate Passport | Auto-created inside `registerAgent()` |
| Apply for Visa / Get Approved | `issueVisaStamp()` |
| Trust Score Update | `updateTrustScore()` |
| Blacklist Database | `blacklistAgent()` + a `mapping(address => bool)` |
| View Passport | `getPassport()` (free, no gas — it's a "read") |

---

## 6. Simplified MVP Option (Recommended for Hackathon Time Constraints)

To avoid burning your limited hackathon time on IPFS + advanced contract design, do this instead:

1. **One single smart contract** with the `Passport` struct above (all fields on-chain, short strings only — keep `agentName`/`purpose` under ~50 characters to save gas)
2. **No IPFS** — skip off-chain storage entirely for now, mention it as future scope
3. **Backend acts as the only signer** — users don't need their own MetaMask wallet; your backend wallet does all the writing, so the demo doesn't depend on judges installing MetaMask
4. **Frontend just displays data** fetched from backend, which fetches from the contract

This gets you a genuinely working, on-chain AgentPassport without a huge engineering lift.

---

## 7. Step-by-Step Build Plan

### Phase 1 — Smart Contract Setup
1. Install **Hardhat** (`npx hardhat init`) — this is your dev environment for writing/testing/deploying Solidity
2. Write `AgentPassport.sol` with the struct + functions from Section 5
3. Test locally using Hardhat's local network first (fast, free, no real testnet needed yet)

### Phase 2 — Get Testnet Funds
4. Install **MetaMask**, create a wallet, switch network to **Polygon Amoy**
   - Network Name: Polygon Amoy Testnet
   - RPC URL: `https://rpc-amoy.polygon.technology`
   - Chain ID: `80002`
   - Currency Symbol: POL
5. Get free testnet POL from the **Polygon Faucet** (faucet.polygon.technology) — just paste your wallet address

### Phase 3 — Deploy
6. Configure Hardhat with your Amoy RPC URL + wallet private key (store private key in `.env`, never hardcode it)
7. Deploy the contract: `npx hardhat run scripts/deploy.js --network amoy`
8. Save the **deployed contract address** — you'll need it in your backend

### Phase 4 — Backend Integration
9. In your Node.js/Express backend, install `ethers.js`
10. Connect to the contract using: RPC URL + Contract Address + Contract ABI (auto-generated by Hardhat) + Backend wallet private key
11. Replace your old DB functions with contract calls:
    - `POST /register` → calls `registerAgent()`
    - `POST /visa/apply` → calls `issueVisaStamp()`
    - `POST /trust/update` → calls `updateTrustScore()`
    - `GET /passport/:agentId` → calls `getPassport()` (read-only, free)

### Phase 5 — Frontend
12. Frontend calls your backend APIs as normal (no change needed here — it doesn't need to know it's blockchain underneath)
13. Add one nice touch: show a **"View on PolygonScan"** link after each transaction, using the transaction hash returned by the backend
    - Example: `https://amoy.polygonscan.com/tx/<transaction_hash>`
    - This is your "proof" moment for judges — click it, and they see the real on-chain record

### Phase 6 — Demo Polish
14. During the demo: register an agent → show the transaction confirming on PolygonScan → apply for visa → show trust score updating on-chain → show the passport stamp recorded permanently
15. This visibly proves: **"This isn't just a database — it's a permanent, tamper-proof record."**

---

## 8. Updated Technology Stack

| Layer | Tech |
|---|---|
| Frontend | React, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| **Blockchain** | **Polygon Amoy Testnet** |
| **Smart Contract** | **Solidity + Hardhat** |
| **Blockchain Connector** | **ethers.js** |
| **Wallet** | MetaMask (for backend signer / setup) |
| Authentication | JWT (for your app login, separate from blockchain) |
| AI | OpenAI / Gemini (for purpose analysis → risk/trust scoring) |
| ~~Database~~ | *Replaced by smart contract storage* |

---

## 9. Demo Talking Points (Why Blockchain Makes This Better)

Use these lines in your presentation:

- *"Instead of a normal database that anyone with backend access could quietly edit, every passport, trust score, and stamp lives on Polygon Amoy — a public, tamper-proof ledger."*
- *"Anyone — a website, a regulator, another AI system — can independently verify an agent's trust score by checking the blockchain directly, with no need to trust our servers."*
- *"This mirrors the real-world passport system: passports aren't self-issued or self-editable — they're issued by a trusted, immutable authority."*

---

## 10. Time-Saving Reminders

- Test everything on **Hardhat's local network first** — don't burn testnet funds/time debugging on Amoy directly
- Keep on-chain strings **short** — gas cost scales with data size
- Have a **backup plan**: if Amoy RPC lags during your live demo, have a screen-recorded backup showing a successful transaction
- Pre-fund your backend wallet with enough test POL **before** the demo — faucets sometimes have cooldowns

---

## 11. Future Scope (Post-Hackathon)

- Move to IPFS/Filecoin for larger metadata storage
- Let agents hold their **own** wallets and sign their own registration (instead of backend signing for them)
- Multi-chain support (agent passports valid across multiple testnets/mainnets)
- Decentralized governance for the blacklist (DAO-style voting instead of a single authority)
- Migrate to mainnet Polygon once the concept is production-ready