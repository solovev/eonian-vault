import { ethers } from 'ethers';
import { makeAutoObservable, runInAction } from 'mobx';
import { autoSave } from './AutoSave';

const networks: Record<number, string> = {
  1: 'Mainnet',
  42: 'Kovan',
  3: 'Ropsten',
  4: 'Rinkeby',
  5: 'Goerli',
};

export const ethereum = (window as any).ethereum;
const provider = new ethers.providers.Web3Provider(ethereum);

class MainStore {
  account: string;
  network: string;

  walletEthBalance: string;
  initialized: boolean;

  constructor() {
    makeAutoObservable(this);

    this.account = '';
    this.network = '';
    this.walletEthBalance = '0';
    this.initialized = false;

    autoSave(this, 'mainStore');
  }

  setAccounts = (accounts: string[]) => {
    const previousAccount = this.account;

    this.account = accounts.length > 0 ? accounts[0] : '';
    this.network = networks[ethereum.networkVersion] ?? '';

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
    runInAction(() => {
      this.walletEthBalance = ethers.utils.formatEther(hexBalance);
      this.initialized = true;
    });
  };
}

const store = new MainStore();

export default store;
