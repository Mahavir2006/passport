import dotenv from "dotenv";
dotenv.config();

const AMOY_PRIVATE_KEY = process.env.AMOY_PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";

export default {
  solidity: "0.8.20",
  networks: {
    amoy: {
      type: "http",
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: [AMOY_PRIVATE_KEY]
    },
  },
};
