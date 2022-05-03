const hre = require('hardhat');

const networkName = hre.network.name;

const networkData = {
  rinkeby: {
    cDAI: '0x6D7F0754FFeb405d23C51CE938289d4835bE3b14',
    DAI: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
  },
  ropsten: {
    DAI: '0x31F42841c2db5173425b5223809CF3A38FEde360',
    cDAI: '0xbc689667c13fb2a04f09272753760e38a95b998c',
  },
  localhost: {
    cDAI: '0x6D7F0754FFeb405d23C51CE938289d4835bE3b14',
    DAI: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
  },
};

const addresses = networkData[networkName.toLowerCase()];

async function main() {
  console.log(`Network "${networkName}", addresses: ${JSON.stringify(addresses, null, 2)}`);

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
