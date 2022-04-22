require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-rinkeby.alchemyapi.io/v2/3QprBrncE4hyqdwT4WlvPcqX2vm5vIaD",
        blockNumber: 10544100
      },
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/297b0cde35d74c9c9d87946821c1bddd",
      // Rinkeby Eonian Deploy Account: 0xf6E13155d16e305624474D890E4FceF3Ec563bda
      //   "45fbe02b3b7ecb56dc795dd4515efc240f7bc25a175d28032fc9b2b63ac1cc55",
      // Test Wallet: 0xCc4C414D00D09aA25A8F6F12Fce61033bE2A7D22
      //   "74a9e19f1fe8f87ac9d8effc3dcc19d70935e5078ab24baa5d5e3f8988e18f7c",
      accounts: ["45fbe02b3b7ecb56dc795dd4515efc240f7bc25a175d28032fc9b2b63ac1cc55", "74a9e19f1fe8f87ac9d8effc3dcc19d70935e5078ab24baa5d5e3f8988e18f7c"],
    },
  },
  etherscan: {
    apiKey: "APBZW2SK8EA48JG83J523FYV62NTN1UXMM",
  },
};
