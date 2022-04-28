import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import { task, HardhatUserConfig } from "hardhat/config";
import { NetworkConfig, NetworkUserConfig } from "hardhat/types";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const rinkebyConfig: NetworkUserConfig = {
  url: "https://rinkeby.infura.io/v3/297b0cde35d74c9c9d87946821c1bddd",
  // Rinkeby Eonian Deploy Account: 0xf6E13155d16e305624474D890E4FceF3Ec563bda
  //   "45fbe02b3b7ecb56dc795dd4515efc240f7bc25a175d28032fc9b2b63ac1cc55",
  // Test Wallet: 0xCc4C414D00D09aA25A8F6F12Fce61033bE2A7D22
  //   "74a9e19f1fe8f87ac9d8effc3dcc19d70935e5078ab24baa5d5e3f8988e18f7c",
  accounts: [
    "45fbe02b3b7ecb56dc795dd4515efc240f7bc25a175d28032fc9b2b63ac1cc55",
    "74a9e19f1fe8f87ac9d8effc3dcc19d70935e5078ab24baa5d5e3f8988e18f7c",
  ],
};

export const forkConfig = {
  url: "https://speedy-nodes-nyc.moralis.io/a3b84d032f1dca31df370455/eth/rinkeby",
  blockNumber: 10544100,
};

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: forkConfig,
    },
    rinkeby: rinkebyConfig,
    "rinkeby-local-fork": { ...rinkebyConfig, url: "http://127.0.0.1:8545" },
  },
  etherscan: {
    apiKey: "APBZW2SK8EA48JG83J523FYV62NTN1UXMM",
  },
  solidity: {
    version: "0.8.4",
    settings: {
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      },
    },
  },
};

export default config;
