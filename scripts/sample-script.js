const hre = require("hardhat");

async function main() {
  await hre.run('compile');

  const addresses = {
    DAI: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
    cDAI: '0x6d7f0754ffeb405d23c51ce938289d4835be3b14',
  }

  // We get the contract to deploy
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(addresses.DAI, addresses.cDAI);

  await vault.deployed();

  console.log("Vault deployed to:", vault.address);

  await new Promise((resolve) => setTimeout(resolve, 30 * 1000))
  
  await hre.run("verify:verify", {
    address: vault.address,
    constructorArguments: [addresses.DAI, addresses.cDAI],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
