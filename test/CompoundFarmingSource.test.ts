import '@nomiclabs/hardhat-ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { getWallet, deploy, transferFromWallet, withDecimals, executeBehalfOf, resetBlockchainAfterEach, getWithdrawEvent } from './Utils';
import { MockContract, smock } from '@defi-wonderland/smock';
import chai from 'chai';
import { CompoundFarmingSource, ERC20, Vault, Vault__factory } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

chai.use(smock.matchers);

const DAI_ABI = require('./abi/dai_abi.json');

const addresses = {
  DAI: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
  cDAI: '0x6d7f0754ffeb405d23c51ce938289d4835be3b14',
  cUSDC: '0x5b281a6dda0b271e91ae35de655ad301c976edb1',
};

const tokenContract = new ethers.Contract(addresses.DAI, DAI_ABI, ethers.provider) as ERC20;

describe('CompoundFarmingSource', function () {
  let vaultContract: MockContract<Vault>;
  let wallet: SignerWithAddress;

  const initMocks = async () => {
    const tokenAddress = addresses.DAI;
    const factory = await smock.mock<Vault__factory>('Vault');
    vaultContract = await factory.deploy(tokenAddress);
    wallet = await getWallet();
  };

  beforeEach((done) => {
    initMocks().then(done);
  });

  afterEach(resetBlockchainAfterEach);

  it('Should initialize with correct predefined values', async () => {
    const walletBalance = await tokenContract.balanceOf(wallet.address);
    expect(+walletBalance).to.equal(300 * 1e18);

    const compoundFarmingSource = await deployFarmingSource();
    const totalBalance = await compoundFarmingSource.getEstimatedTotalBalance();
    expect(totalBalance).to.equal(0);
  });

  it('Should not be initialized if underlying tokens do not match', async () => {
    const compoundFarmingSource = await deployFarmingSource(false);
    await expect(compoundFarmingSource.initialize(vaultContract.address, addresses.cUSDC)).to.be.revertedWith(
      "Underlying tokens don't match",
    );
  });

  it('Should change total balance after receiving some amount of underlying token', async () => {
    const compoundFarmingSource = await deployFarmingSource();
    await supply(compoundFarmingSource.address, 10);

    const totalBalance = await compoundFarmingSource.getEstimatedTotalBalance();
    expect(+totalBalance).to.equal(10 * 1e18);

    const walletBalance = await tokenContract.balanceOf(wallet.address);
    expect(+walletBalance).to.equal(290 * 1e18);
  });

  it('Should realize free amount of existing underlying token', async () => {
    const compoundFarmingSource = await deployFarmingSource();
    await supply(compoundFarmingSource.address, 10);

    let underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
    expect(+underlyingBalance).to.equal(10 * 1e18);

    await compoundFarmingSource.realizeExcessBalance();

    underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
    expect(underlyingBalance).to.equal(0);

    const totalBalance = await compoundFarmingSource.getEstimatedTotalBalance();
    expect(+totalBalance).to.be.greaterThan(0);
  });

  it('Should withdraw some amount from unrealized assets', async () => {
    await executeBehalfOf(wallet, vaultContract, async (signer) => {
      const compoundFarmingSource = await deployFarmingSource(true, signer);

      await supply(compoundFarmingSource.address, 10);

      let underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(+underlyingBalance).to.equal(10 * 1e18);

      await compoundFarmingSource.updateExchangeRate();

      const amountToWithdraw = await withDecimals(5, tokenContract);
      await compoundFarmingSource.withdraw(amountToWithdraw);

      underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(underlyingBalance).to.equal(amountToWithdraw);

      const vaultBalance = await tokenContract.balanceOf(vaultContract.address);
      expect(vaultBalance.eq(amountToWithdraw)).to.be.true;
    });
  });

  it('Should withdraw some amount from partly realized assets', async () => {
    await executeBehalfOf(wallet, vaultContract, async (signer) => {
      const compoundFarmingSource = await deployFarmingSource(true, signer);

      await supply(compoundFarmingSource.address, 5);

      let balance = await compoundFarmingSource.getEstimatedTotalBalance();
      expect(+balance).to.equal(5 * 1e18);

      await compoundFarmingSource.realizeExcessBalance();

      await supply(compoundFarmingSource.address, 5);

      await compoundFarmingSource.updateExchangeRate();

      balance = await compoundFarmingSource.getEstimatedTotalBalance();
      expect(+balance).to.be.greaterThan(10 * 1e18);

      const amountToWithdraw = await withDecimals(6, tokenContract);
      await compoundFarmingSource.withdraw(amountToWithdraw);

      const underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(underlyingBalance).to.equal(0);

      balance = await compoundFarmingSource.getEstimatedTotalBalance();
      expect(+balance).to.be.greaterThan(4 * 1e18);

      const vaultBalance = await tokenContract.balanceOf(vaultContract.address);
      expect(vaultBalance.eq(amountToWithdraw)).to.be.true;
    });
  });

  it('Should withdraw some amount from realized assets', async () => {
    await executeBehalfOf(wallet, vaultContract, async (signer) => {
      const compoundFarmingSource = await deployFarmingSource(true, signer);

      await supply(compoundFarmingSource.address, 10);

      let balance = await compoundFarmingSource.getEstimatedTotalBalance();
      expect(+balance).to.equal(10 * 1e18);

      await compoundFarmingSource.realizeExcessBalance();

      // Check if all underlying assets are realized
      let underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(underlyingBalance).to.equal(0);

      await compoundFarmingSource.updateExchangeRate();

      const amountToWithdraw = await withDecimals(6, tokenContract);
      await compoundFarmingSource.withdraw(amountToWithdraw);

      underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(underlyingBalance).to.equal(0);

      balance = await compoundFarmingSource.getEstimatedTotalBalance();
      expect(+balance).to.be.greaterThan(4 * 1e18);

      const vaultBalance = await tokenContract.balanceOf(vaultContract.address);
      expect(vaultBalance.eq(amountToWithdraw)).to.be.true;
    });
  });

  it('Should withdraw full amount from unrealized assets', async () => {
    await executeBehalfOf(wallet, vaultContract, async (signer) => {
      const compoundFarmingSource = await deployFarmingSource(true, signer);

      await supply(compoundFarmingSource.address, 10);

      let underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(+underlyingBalance).to.equal(10 * 1e18);

      await compoundFarmingSource.updateExchangeRate();

      const amountToWithdraw = await withDecimals(10, tokenContract);
      await compoundFarmingSource.withdraw(amountToWithdraw);

      underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(underlyingBalance).to.equal(0);

      const vaultBalance = await tokenContract.balanceOf(vaultContract.address);
      expect(vaultBalance.eq(amountToWithdraw)).to.be.true;
    });
  });

  it('Should withdraw full amount from partly unrealized assets', async () => {
    await executeBehalfOf(wallet, vaultContract, async (signer) => {
      const compoundFarmingSource = await deployFarmingSource(true, signer);

      await supply(compoundFarmingSource.address, 5);

      let underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(+underlyingBalance).to.equal(5 * 1e18);

      await compoundFarmingSource.realizeExcessBalance();

      await supply(compoundFarmingSource.address, 5);

      await compoundFarmingSource.updateExchangeRate();

      const amountToWithdraw = await withDecimals(10, tokenContract);
      await compoundFarmingSource.withdraw(amountToWithdraw);

      underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(underlyingBalance).to.equal(0);

      const vaultBalance = await tokenContract.balanceOf(vaultContract.address);
      expect(vaultBalance.eq(amountToWithdraw)).to.be.true;
    });
  });

  it('Should withdraw full amount from realized assets', async () => {
    await executeBehalfOf(wallet, vaultContract, async (signer) => {
      const compoundFarmingSource = await deployFarmingSource(true, signer);

      await supply(compoundFarmingSource.address, 10);

      let underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(+underlyingBalance).to.equal(10 * 1e18);

      await compoundFarmingSource.realizeExcessBalance();

      await compoundFarmingSource.updateExchangeRate();

      const amountToWithdraw = await withDecimals(10, tokenContract);
      await compoundFarmingSource.withdraw(amountToWithdraw);

      underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(underlyingBalance).to.equal(0);

      const vaultBalance = await tokenContract.balanceOf(vaultContract.address);
      expect(vaultBalance.eq(amountToWithdraw)).to.be.true;
    });
  });

  it('Should withdraw extra amount from unrealized assets', async () => {
    await executeBehalfOf(wallet, vaultContract, async (signer) => {
      const compoundFarmingSource = await deployFarmingSource(true, signer);

      await supply(compoundFarmingSource.address, 10);

      let underlyingBalance = await compoundFarmingSource.getUnderlyingTokenBalance();
      expect(+underlyingBalance).to.equal(10 * 1e18);

      await compoundFarmingSource.updateExchangeRate();

      const amountToWithdraw = await withDecimals(11, tokenContract);
      const txn = await compoundFarmingSource.withdraw(amountToWithdraw);

      const [requiredAmount, loss] = await getWithdrawEvent(txn);
      expect(requiredAmount).to.equal(amountToWithdraw);
      expect(loss).to.equal(underlyingBalance.sub(requiredAmount).mul(-1));

      const totalBalance = await compoundFarmingSource.getEstimatedTotalBalance();
      expect(totalBalance).to.equal(0);

      const vaultBalance = await tokenContract.balanceOf(vaultContract.address);
      expect(vaultBalance.eq(amountToWithdraw.sub(loss))).to.be.true;
    });
  });

  it('Should withdraw extra amount from partly realized assets', async () => {
    await executeBehalfOf(wallet, vaultContract, async (signer) => {
      const compoundFarmingSource = await deployFarmingSource(true, signer);

      const amountToRealize = 6;
      await supply(compoundFarmingSource.address, amountToRealize);

      await compoundFarmingSource.realizeExcessBalance();

      await supply(compoundFarmingSource.address, 5);

      await compoundFarmingSource.updateExchangeRate();

      const amountToWithdraw = await withDecimals(12, tokenContract);
      const txn = await compoundFarmingSource.withdraw(amountToWithdraw);

      const [requiredAmount, loss] = await getWithdrawEvent(txn);
      expect(requiredAmount).to.equal(amountToWithdraw);

      const vaultBalance = await tokenContract.balanceOf(vaultContract.address);
      expect(vaultBalance.eq(amountToWithdraw.sub(loss))).to.be.true;
    });
  });

  it('Should withdraw extra amount from realized assets', async () => {
    await executeBehalfOf(wallet, vaultContract, async (signer) => {
      const compoundFarmingSource = await deployFarmingSource(true, signer);

      const amountToRealize = 12;
      await supply(compoundFarmingSource.address, amountToRealize);

      await compoundFarmingSource.realizeExcessBalance();

      await compoundFarmingSource.updateExchangeRate();

      const amountToWithdraw = await withDecimals(amountToRealize + 1, tokenContract);
      const txn = await compoundFarmingSource.withdraw(amountToWithdraw);

      const [requiredAmount, loss] = await getWithdrawEvent(txn);
      expect(requiredAmount).to.equal(amountToWithdraw);

      const vaultBalance = await tokenContract.balanceOf(vaultContract.address);
      expect(vaultBalance.eq(amountToWithdraw.sub(loss))).to.be.true;
    });
  });

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // -=-=-=-=-=- TEST HELPERS -=-=-=-=-=-=
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  async function supply(address: string, amount: number): Promise<BigNumber> {
    return await transferFromWallet({
      tokenContract,
      wallet,
      toAddress: address,
      amount,
    });
  }

  async function deployFarmingSource(init = true, signer?: SignerWithAddress): Promise<CompoundFarmingSource> {
    const farmingSource = await deploy<CompoundFarmingSource>({ name: 'CompoundFarmingSource' });
    if (!init) {
      return farmingSource;
    }
    await farmingSource.initialize(vaultContract.address, addresses.cDAI);

    return signer ? farmingSource.connect(signer) : farmingSource;
  }
});
