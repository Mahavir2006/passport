import dotenv from "dotenv";
dotenv.config();

const AMOY_PRIVATE_KEY = process.env.AMOY_PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";

export default {
  solidity: "0.8.20",
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545"
    }
  },
};
