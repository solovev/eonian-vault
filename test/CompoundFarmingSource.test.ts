import "@nomiclabs/hardhat-ethers";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  TEST_WALLET_ADDRESS,
  getWallet,
  getBalance,
  deploy,
  transferFromWallet,
  toCountable,
  withDecimals,
} from "./Utils";
import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import chai from "chai";
import {
  CompoundFarmingSource,
  ERC20,
  ICERC20,
  IERC20Metadata,
  Vault,
  Vault__factory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BaseContract, BigNumber, Contract } from "ethers";
import { forkConfig } from "../hardhat.config";

chai.use(smock.matchers);

const DAI_ABI = require("./dai_abi.json");
const CDAI_ABI = require("./cdai_abi.json");

const addresses = {
  DAI: "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
  cDAI: "0x6d7f0754ffeb405d23c51ce938289d4835be3b14",
  cUSDC: "0x5b281a6dda0b271e91ae35de655ad301c976edb1",
};

const tokenContract = new ethers.Contract(
  addresses.DAI,
  DAI_ABI,
  ethers.provider
) as ERC20;

const cTokenContract = new ethers.Contract(
  addresses.cDAI,
  CDAI_ABI,
  ethers.provider
) as ERC20 & ICERC20;

describe("CompoundFarmingSource", function () {
  let vaultContract: MockContract<Vault>;
  let wallet: SignerWithAddress;

  const initMocks = async () => {
    const tokenAddress = addresses.DAI;
    const factory = await smock.mock<Vault__factory>("Vault");
    vaultContract = await factory.deploy(tokenAddress);
    wallet = await getWallet();
  };

  beforeEach((done) => {
    initMocks().then(done);
  });

  afterEach((done) => {
    network.provider
      .request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: forkConfig.url,
              blockNumber: forkConfig.blockNumber,
            },
          },
        ],
      })
      .then(() => done())
      .catch(done);
  });

  it("Should initialize with correct predefined values", async () => {
    const walletBalance = await getBalance(tokenContract, wallet.address);
    expect(walletBalance).to.equal(300);

    const compoundFarmingSource = await deployFarmingSource();
    const fsBalance = await compoundFarmingSource.getEstimatedTotalBalance();
    expect(fsBalance).to.equal(0);
  });

  it("Should not be initialized if underlying tokens do not match", async () => {
    const compoundFarmingSource = await deployFarmingSource(false);
    await expect(
      compoundFarmingSource.initialize(vaultContract.address, addresses.cUSDC)
    ).to.be.revertedWith("Underlying tokens don't match");
  });

  it("Should change total balance after receiving some amount of underlying token", async () => {
    const compoundFarmingSource = await deployFarmingSource();
    const transferredValue = await transferFromWallet({
      tokenContract,
      wallet,
      toAddress: compoundFarmingSource.address,
      amount: 10,
    });

    const fsBalance = await compoundFarmingSource.getEstimatedTotalBalance();
    expect(fsBalance).to.equal(transferredValue);

    const walletBalance = await getBalance(tokenContract, wallet.address);
    expect(walletBalance).to.equal(290);
  });

  it("Should realize free amount of existing underlying token", async () => {
    const compoundFarmingSource = await deployFarmingSource();
    const transferredValue = await transferFromWallet({
      tokenContract,
      wallet,
      toAddress: compoundFarmingSource.address,
      amount: 10,
    });

    let fsUndBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
    expect(fsUndBalance).to.equal(transferredValue);

    await compoundFarmingSource.realizeExcessBalance();

    fsUndBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
    expect(fsUndBalance).to.equal(0);

    const fsBalance = await compoundFarmingSource.getEstimatedTotalBalance();
    expect(+fsBalance).to.be.greaterThan(0);
  });

  it("Should withdraw full amount from unrealized assets", async () => {
    await executeBehalfOf(vaultContract, async (signer) => {
      let compoundFarmingSource = await deployFarmingSource();
      compoundFarmingSource = compoundFarmingSource.connect(signer);

      const transferredValue = await transferFromWallet({
        tokenContract,
        wallet,
        toAddress: compoundFarmingSource.address,
        amount: 10,
      });

      let fsUndBalance =
        await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(fsUndBalance).to.equal(transferredValue);

      await compoundFarmingSource.updateExchangeRate();

      const amountToWithdraw = await withDecimals(5, tokenContract);
      await compoundFarmingSource.withdraw(amountToWithdraw);

      fsUndBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(fsUndBalance).to.equal(amountToWithdraw);
    });
  });

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // -=-=-=-=-=- TEST HELPERS -=-=-=-=-=-=
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  async function executeBehalfOf<T extends BaseContract>(
    contract: T | MockContract<T>,
    callback: (sigher: SignerWithAddress) => Promise<void>
  ) {
    await wallet.sendTransaction({
      to: contract.address,
      value: ethers.utils.parseEther("0.03"),
    });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [contract.address],
    });
    const signer = await ethers.getSigner(contract.address);
    await callback(signer);
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [contract.address],
    });
  }

  async function deployFarmingSource(
    init = true
  ): Promise<CompoundFarmingSource> {
    const farmingSource = await deploy<CompoundFarmingSource>(
      "CompoundFarmingSource"
    );
    if (!init) {
      return farmingSource;
    }
    await farmingSource.initialize(vaultContract.address, addresses.cDAI);
    return farmingSource;
  }
});
