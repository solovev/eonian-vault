import { ethers } from 'ethers';
import { makeAutoObservable, runInAction } from 'mobx';
import { autoSave } from './AutoSave';
import VaultContractData from '../../artifacts/contracts/Vault.sol/Vault.json';
import FSContractData from '../../artifacts/contracts/sources/CompoundFarmingSource.sol/CompoundFarmingSource.json';
import ICERC20 from '../../artifacts/contracts/sources/CompoundFarmingSource.sol/ICERC20.json';
import { SECONDS_PER_BLOCK } from '../consts';

const networks: Record<number, string> = {
  1: 'Mainnet',
  42: 'Kovan',
  3: 'Ropsten',
  4: 'Rinkeby',
  5: 'Goerli',
};

export const ethereum = (window as any).ethereum;
const provider = new ethers.providers.Web3Provider(ethereum);

let vaultAddress: string = '0x00';
let vault: ethers.Contract;

let fsAddress: string = '0x00';
let fs: ethers.Contract;

let daiAddress: string = '0x00';
let dai: ethers.Contract;

let cdaiAddress: string = '0x00';
let cdai: ethers.Contract;

function setupContracts(network: string, isGanacheFork = false) {
  const addresses: Record<string, string> = {};

  const getEnv = (key: string, defaultValue: string) => {
    const keyWithNetwork = key + '_' + network.toUpperCase();
    const value = process.env[keyWithNetwork + (isGanacheFork ? '_LOCALHOST' : undefined)] ?? process.env[keyWithNetwork] ?? defaultValue;
    addresses[key] = value;
    return value;
  };

  vaultAddress = getEnv('REACT_APP_VAULT_CA', '0x00');
  vault = new ethers.Contract(vaultAddress, VaultContractData.abi, provider);

  fsAddress = getEnv('REACT_APP_COMPOUND_FS_CA', '0x00');
  fs = new ethers.Contract(fsAddress, FSContractData.abi, provider);

  daiAddress = getEnv('REACT_APP_DAI_CA', '0x00');
  dai = new ethers.Contract(daiAddress, ICERC20.abi, provider);

  cdaiAddress = getEnv('REACT_APP_CDAI_CA', '0x00');
  cdai = new ethers.Contract(cdaiAddress, ICERC20.abi, provider);

  console.log(`Network changed: ${network} (Localhost: ${isGanacheFork}), addresses: ${JSON.stringify(addresses, null, 2)}`);
}

class MainStore {
  account: string;
  network: string;

  walletEthBalance: string;
  totalShares: string;
  walletShares: string;
  supplyRatePerBlock: string;
  totalBalance: string;
  walletDaiBalance: string;
  fsDaiBalance: string;
  vaultDaiBalance: string;
  fsCdaiBalance: string;
  apy: string;
  dailyIncome: string;
  vaultTotalBalance: string;

  initialized: boolean;

  constructor() {
    makeAutoObservable(this);

    this.account = '';
    this.network = '';

    this.walletEthBalance = '0.0';
    this.totalShares = '0.0';
    this.walletShares = '0.0';
    this.supplyRatePerBlock = '0.0';
    this.totalBalance = '0.0';
    this.walletDaiBalance = '0.0';
    this.fsDaiBalance = '0.0';
    this.vaultDaiBalance = '0.0';
    this.fsCdaiBalance = '0.0';
    this.dailyIncome = '0.0';
    this.apy = '0.0';
    this.vaultTotalBalance = '0.0';

    this.initialized = false;

    autoSave(this, 'mainStore');

    setupContracts(this.network);

    window.setInterval(this.updateValues, SECONDS_PER_BLOCK * 1000);

    ethereum.on('chainChanged', () => {
      localStorage.removeItem('mainStore');
      window.location.reload();
    });
  }

  setNetwork = (chainId?: number) => {
    this.network = networks[chainId ?? ethereum.networkVersion] ?? '';

    const isGanacheFork = parseInt(chainId ?? ethereum.chainId, 16) === 1337;
    setupContracts(this.network, isGanacheFork);
  };

  setAccounts = (accounts: string[]) => {
    const previousAccount = this.account;

    this.account = accounts.length > 0 ? accounts[0] : '';
    this.setNetwork();

    if (!this.network) {
      setupContracts(this.network);
    }

    this.initialized = previousAccount !== this.account;
    if (!this.initialized) {
      this.updateValues();
    }
  };

  updateValues = async () => {
    if (!this.account) {
      return;
    }

    const hexBalance = await provider.getBalance(this.account);

    const totalShares = await vault.totalSupply();
    const walletShares = await vault.balanceOf(this.account);
    const supplyRate = await fs.getInterestRate();
    const totalBalance = await vault.getValueOfShares(walletShares);
    const vaultTotalBalance = await vault.getTotalBalance();
    const walletDaiBalance = await dai.balanceOf(this.account);
    const fsDaiBalance = await dai.balanceOf(fsAddress);
    const vaultDaiBalance = await dai.balanceOf(vaultAddress);
    const fsCdaiBalance = await cdai.balanceOf(fsAddress);
    const [dailyIncome, apy] = await calcIncomeData(cdai);

    runInAction(() => {
      this.walletEthBalance = ethers.utils.formatEther(hexBalance);
      this.totalShares = ethers.utils.formatEther(totalShares);
      this.walletShares = ethers.utils.formatEther(walletShares);
      this.supplyRatePerBlock = ethers.utils.formatEther(supplyRate);
      this.totalBalance = ethers.utils.formatEther(totalBalance);
      this.vaultTotalBalance = ethers.utils.formatEther(vaultTotalBalance);
      this.walletDaiBalance = ethers.utils.formatEther(walletDaiBalance);
      this.fsDaiBalance = ethers.utils.formatEther(fsDaiBalance);
      this.vaultDaiBalance = ethers.utils.formatEther(vaultDaiBalance);
      this.fsCdaiBalance = ethers.utils.formatEther(fsCdaiBalance);
      this.apy = apy.toFixed(2);

      const income = dailyIncome * +this.totalBalance;
      this.dailyIncome = income ? income.toFixed(6) : '0.0';

      this.initialized = true;
    });
  };

  deposit = async (amount: number) => {
    try {
      const amountToDeposit = ethers.utils.parseUnits(String(amount), 18);

      const ethereum = (window as any).ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const vaultWithSigner = vault.connect(signer);
      const daiWithSigner = dai.connect(signer);

      const approveTxn = await daiWithSigner.approve(vault.address, amountToDeposit);
      console.log(`Approve transaction:`, approveTxn);
      await approveTxn.wait();
      console.log(`Approved`);

      const depositTxn = await vaultWithSigner.deposit(amountToDeposit);
      console.log(`Deposit transaction:`, depositTxn);
      await depositTxn.wait();
      console.log(`Deposited`);

      await this.updateValues();
    } catch (e) {
      console.error('Deposit', e);
    }
  };

  withdraw = async (amount: number) => {
    try {
      const amountToWithdraw = ethers.utils.parseUnits(String(amount), 18);
      const ethereum = (window as any).ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const vaultWithSigner = vault.connect(signer);

      const txn = await fs.connect(signer).updateExchangeRate();
      await txn.wait();

      console.log(`Starting withdrawal`);
      const withdrawTxn = await vaultWithSigner.withdraw(amountToWithdraw);
      console.log(`Withdraw transaction:`, withdrawTxn);

      await withdrawTxn.wait();
      console.log(`Withdrawed`);

      await this.updateValues();
    } catch (e) {
      console.error('Withdraw', e);
    }
  };
}

async function calcIncomeData(cToken: ethers.Contract) {
  const blocksPerDay = (60 * 60 * 24) / SECONDS_PER_BLOCK;
  const daysPerYear = 365;
  const supplyRatePerBlock = await cToken.supplyRatePerBlock();

  const dailyIncome = (supplyRatePerBlock / 1e18) * blocksPerDay;
  return [dailyIncome, (Math.pow(dailyIncome + 1, daysPerYear) - 1) * 100];
}

const store = new MainStore();

export default store;
