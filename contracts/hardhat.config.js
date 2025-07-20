require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const { PrivateKey } = require("@hashgraph/sdk");

function getPrivateKey() {
    const privateKeyString = process.env.PRIVATE_KEY;
    if (!privateKeyString) {
        throw new Error("Please set your PRIVATE_KEY in the .env file");
    }
    const privateKey = PrivateKey.fromString(privateKeyString);
    return "0x" + privateKey.toStringRaw();
}

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
    }
  },
  networks: {
    testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [getPrivateKey()],
      chainId: 296
    },
    mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: [getPrivateKey()],
      chainId: 295
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}; 