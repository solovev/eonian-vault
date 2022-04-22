const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const DAI_ABI = require("./dai_abi.json");
const CDAI_ABI = require("./cdai_abi.json");

const TEST_WALLET_ADDRESS = "0xCc4C414D00D09aA25A8F6F12Fce61033bE2A7D22";

const addresses = {
  DAI: "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
  cDAI: "0x6d7f0754ffeb405d23c51ce938289d4835be3b14",
};

describe("Vault", function () {
  it("Should receive specified ERC20 token", async function () {
    const wallet = await getWallet();

    const tokenContract = new ethers.Contract(
      addresses.DAI,
      DAI_ABI,
      ethers.provider
    );

    const cTokenContract = new ethers.Contract(
      addresses.cDAI,
      CDAI_ABI,
      ethers.provider
    );

    const balance = await getBalance(tokenContract, wallet.address);
    expect(balance).to.equal(300);

    const vaultContract = await deployVault();
    const vaultBalance = await vaultContract.getBalance();
    expect(vaultBalance).to.equal(0);

    const cTokenDecimals = await cTokenContract.decimals();
    let cBalance = await cTokenContract.balanceOf(vaultContract.address);
    expect(cBalance / Math.pow(10, cTokenDecimals)).to.equal(0);

    await approve(tokenContract, wallet, vaultContract, 15);

    const allowToGet = await getAllowance(
      tokenContract,
      wallet.address,
      vaultContract.address
    );
    expect(allowToGet, 15);

    await supplyToVault(vaultContract, tokenContract, wallet, 15);

    const tokenDecimals = await tokenContract.decimals();
    const newVaultBalance =
      (await vaultContract.getBalance()) / Math.pow(10, tokenDecimals);
    expect(newVaultBalance).to.equal(0);

    const newWalletBalance = await getBalance(tokenContract, wallet.address);
    expect(newWalletBalance).to.equal(285);

    cBalance = await cTokenContract.balanceOf(vaultContract.address);
    expect(cBalance / Math.pow(10, cTokenDecimals)).to.be.greaterThan(0);
  });

  async function supplyToVault(vaultContract, tokenContract, wallet, amount) {
    const vaultContractWithSigner = vaultContract.connect(wallet);

    const tokenDecimals = await tokenContract.decimals();
    amount *= Math.pow(10, tokenDecimals);

    const supplyTx = await vaultContractWithSigner.supply(amount + "");
    await supplyTx.wait();
  }

  async function deployVault() {
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(addresses.DAI, addresses.cDAI);
    await vault.deployed();
    return vault;
  }

  async function getBalance(tokenContract, address) {
    const tokenDecimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(address);
    return balance / Math.pow(10, tokenDecimals);
  }

  async function approve(tokenContract, wallet, vaultContract, amount) {
    const tokenContractWithSigner = tokenContract.connect(wallet);

    const tokenDecimals = await tokenContract.decimals();
    amount *= Math.pow(10, tokenDecimals);

    const approveTx = await tokenContractWithSigner.approve(
      vaultContract.address,
      amount + ""
    );
    await approveTx.wait();
  }

  async function getAllowance(tokenContract, ownerAddress, spenderAddress) {
    const amount = await tokenContract.allowance(ownerAddress, spenderAddress);
    const tokenDecimals = await tokenContract.decimals();
    return amount / Math.pow(10, tokenDecimals);
  }

  async function getWallet() {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [TEST_WALLET_ADDRESS],
    });
    return ethers.getSigner(TEST_WALLET_ADDRESS);
  }
});
