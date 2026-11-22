require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const { SEPOLIA_RPC_URL, PRIVATE_KEY, GANACHE_PRIVATE_KEY } = process.env;
module.exports = {
  // evmVersion "paris" => no PUSH0 opcode, so contracts run on Ganache too
  solidity: { version: "0.8.24", settings: { evmVersion: "paris", optimizer: { enabled: true, runs: 200 } } },
  networks: {
    ganache: { url: "http://127.0.0.1:7545", chainId: 1337, accounts: GANACHE_PRIVATE_KEY ? [GANACHE_PRIVATE_KEY] : undefined },
    sepolia: { url: SEPOLIA_RPC_URL || "", chainId: 11155111, accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [] },
  },
};
