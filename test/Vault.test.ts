import '@nomiclabs/hardhat-ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { getWallet, deploy, resetBlockchainAfterEach, withDecimals } from './Utils';
import { MockContract, smock } from '@defi-wonderland/smock';
import chai from 'chai';
import { CompoundFarmingSource, CompoundFarmingSource__factory, ERC20, Vault } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { constants } from 'ethers';

chai.use(smock.matchers);

const DAI_ABI = require('./abi/dai_abi.json');

const addresses = {
  DAI: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
  cDAI: '0x6d7f0754ffeb405d23c51ce938289d4835be3b14',
  cUSDC: '0x5b281a6dda0b271e91ae35de655ad301c976edb1',
};

const tokenContract = new ethers.Contract(addresses.DAI, DAI_ABI, ethers.provider) as ERC20;

describe('Vault', function () {
  let vaultContract: Vault;
  let farmingSource: MockContract<CompoundFarmingSource>;

  let wallet: SignerWithAddress;

  const initMocks = async (initFarmingSource = true) => {
    wallet = await getWallet();

    vaultContract = await deploy<Vault>({ name: 'Vault' }, addresses.DAI);

    const factory = await smock.mock<CompoundFarmingSource__factory>('CompoundFarmingSource');
    farmingSource = await factory.deploy();
    farmingSource.initialize(vaultContract.address, addresses.cDAI);

    if (initFarmingSource) {
      await vaultContract.setFarmingSource(farmingSource.address);
    }
  };

  beforeEach((done) => {
    initMocks().then(done);
  });

  afterEach(resetBlockchainAfterEach);

  it('Should set farming source', async () => {
    await initMocks(false);

    expect(await vaultContract.getFarmingSource()).to.equal(constants.AddressZero);

    await vaultContract.setFarmingSource(farmingSource.address);

    expect(await vaultContract.getFarmingSource()).to.equal(farmingSource.address);
  });

  it('Should not set farming source if caller is not the owner', async () => {
    await initMocks(false);

    const vaultContractWithSigner = vaultContract.connect(wallet);

    expect(await vaultContractWithSigner.getFarmingSource()).to.equal(constants.AddressZero);

    await expect(vaultContractWithSigner.setFarmingSource(farmingSource.address)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should revert on deposit if there is no such allowance for sender', async () => {
    const vaultContractWithSigner = vaultContract.connect(wallet);
    const amountToDeposit = await withDecimals(5, tokenContract);
    await expect(vaultContractWithSigner.deposit(amountToDeposit)).to.be.revertedWith('string');
  });

  it('Should mint vault shares as 1:1 for sender after the first deposit', async () => {
    const vaultContractWithSigner = vaultContract.connect(wallet);
    const tokenContractWithSigner = tokenContract.connect(wallet);

    const walletBalanceBeforeDeposit = await tokenContract.balanceOf(wallet.address);

    const totalSharesBeforeDeposit = await vaultContractWithSigner.totalSupply();

    const amountToDeposit = await withDecimals(5, tokenContract);
    await tokenContractWithSigner.approve(vaultContract.address, amountToDeposit);
    await vaultContractWithSigner.deposit(amountToDeposit);

    const totalSharesAfterDeposit = await vaultContractWithSigner.totalSupply();
    expect(totalSharesAfterDeposit.sub(totalSharesBeforeDeposit).eq(amountToDeposit)).to.be.true;

    const walletBalanceAfterDeposit = await tokenContract.balanceOf(wallet.address);
    expect(walletBalanceBeforeDeposit.sub(walletBalanceAfterDeposit).eq(amountToDeposit)).to.be.true;

    const shares = await vaultContract.balanceOf(wallet.address);
    expect(shares.eq(amountToDeposit)).to.be.true;
  });

  it('Should burn vault shares after the withdrawal', async () => {
    const vaultContractWithSigner = vaultContract.connect(wallet);
    const tokenContractWithSigner = tokenContract.connect(wallet);

    const amountToDeposit = await withDecimals(5, tokenContract);
    await tokenContractWithSigner.approve(vaultContract.address, amountToDeposit);
    await vaultContractWithSigner.deposit(amountToDeposit);

    const walletSharesBefore = await vaultContract.balanceOf(wallet.address);
    expect(walletSharesBefore.eq(amountToDeposit)).to.be.true;

    const totalSharesBeforeWithdraw = await vaultContractWithSigner.totalSupply();
    expect(totalSharesBeforeWithdraw.eq(amountToDeposit)).to.be.true;

    await vaultContractWithSigner.withdraw(amountToDeposit);

    const totalSharesAfterWithdraw = await vaultContractWithSigner.totalSupply();
    expect(totalSharesAfterWithdraw.eq(0)).to.be.true;

    const walletSharesAfter = await vaultContract.balanceOf(wallet.address);
    expect(walletSharesAfter.eq(0)).to.be.true;
  });

  it.only('Should return assets after the withdrawal', async () => {
    const vaultContractWithSigner = vaultContract.connect(wallet);
    const tokenContractWithSigner = tokenContract.connect(wallet);

    const amountToDeposit = await withDecimals(5, tokenContract);
    await tokenContractWithSigner.approve(vaultContract.address, amountToDeposit);
    await vaultContractWithSigner.deposit(amountToDeposit);

    const walletBalanceBeforeWithdrawal = await tokenContractWithSigner.balanceOf(wallet.address);

    await vaultContractWithSigner.withdraw(amountToDeposit);

    const walletBalanceAfterWithdrawal = await tokenContractWithSigner.balanceOf(wallet.address);

    expect(+walletBalanceAfterWithdrawal).to.be.greaterThanOrEqual(+walletBalanceBeforeWithdrawal);
  });
});
