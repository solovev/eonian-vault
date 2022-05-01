const hre = require('hardhat');

const addresses = {
  DAI: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
  cDAI: '0x6d7f0754ffeb405d23c51ce938289d4835be3b14',
};

async function main() {
  const vault = await deployVault();
  const vaultAddress = vault.address;
  console.log('Vault deployed to:', vaultAddress);

  const fsAddress = await deployFS(vaultAddress);
  console.log('FS deployed to:', fsAddress);

  console.log('Set Vault FS to:', fsAddress);
  await vault.setFarmingSource(fsAddress);

  const waitingFor = 30 * 1000;
  console.log(`Waiting for ${waitingFor}ms until verifying`);
  await new Promise((resolve) => setTimeout(resolve, waitingFor));

  await verify(vaultAddress, [addresses.DAI]);
  await verify(fsAddress, []);
}

async function deployVault() {
  await hre.run('compile');

  const Vault = await hre.ethers.getContractFactory('Vault');
  const vault = await Vault.deploy(addresses.DAI);

  await vault.deployed();

  return vault;
}

async function deployFS(vaultAddress) {
  await hre.run('compile');

  const CompoundFarmingSource = await hre.ethers.getContractFactory('CompoundFarmingSource');
  const compoundFarmingSource = await CompoundFarmingSource.deploy();

  await compoundFarmingSource.deployed();
  await compoundFarmingSource.initialize(vaultAddress, addresses.cDAI);

  return compoundFarmingSource.address;
}

async function verify(address, args) {
  try {
    await hre.run('verify:verify', {
      address: address,
      constructorArguments: args,
    });
  } catch (e) {
    console.error(e);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
