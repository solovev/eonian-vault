import React from 'react';
import './App.scss';
import BarChip from './components/BarChip';
import InfoTopBar from './components/InfoTopBar';
import ethIcon from './icons/eth.svg';
import MetaMaskOnboarding from '@metamask/onboarding';
import MetaMaskAddressInfo from './components/MetaMaskAddressInfo';
import Loading from './components/Loading';
import SideBar from './components/SideBar';
import Content from './components/Content';
import { ethers } from 'ethers';

const networks: Record<number, string> = {
  1: 'Mainnet',
  42: 'Kovan',
  3: 'Ropsten',
  4: 'Rinkeby',
  5: 'Goerli',
};

async function getBalance(address: string, provider: ethers.providers.Web3Provider) {
  const balance = await provider.getBalance(address || 'ethers.eth');
  console.log(ethers.utils.formatEther(balance));
}

function App() {
  const ethereum = (window as any).ethereum;

  const [network, setNetwork] = React.useState(getCache('network', ''));
  const [accounts, setAccounts] = React.useState(getCache<string[]>('accounts', []));

  const provider = React.useMemo(() => {
    return new ethers.providers.Web3Provider(ethereum);
  }, [ethereum]);

  React.useEffect(() => {
    getBalance(accounts[0], provider);
  }, [provider, accounts]);

  const handleAccountsChanged = React.useCallback(
    (accounts: string[]) => {
      cache('accounts', accounts);
      setAccounts(accounts);

      const network = networks[ethereum.networkVersion] ?? '';
      cache('network', network);
      setNetwork(network);
    },
    [ethereum, setAccounts, setNetwork],
  );

  React.useEffect(() => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      ethereum.request({ method: 'eth_requestAccounts' }).then(handleAccountsChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, [ethereum, handleAccountsChanged]);

  const isConnected = React.useMemo(() => accounts.length > 0, [accounts]);

  return (
    <div className="main-container">
      <div className="sub-container">
        <InfoTopBar
          startElement={isConnected && <BarChip text="Total balance: 0 USD" />}
          endElement={
            <>
              {renderNetwork()}
              <MetaMaskAddressInfo accounts={accounts} />
            </>
          }
        ></InfoTopBar>
        <div className="wrapper">
          <SideBar />
          <div className="content">{!isConnected ? renderLoadingSpinner() : <Content />}</div>
        </div>
      </div>
    </div>
  );

  function renderLoadingSpinner() {
    return (
      <div className="content__loading">
        <Loading size={70} />
      </div>
    );
  }

  function renderNetwork() {
    if (!network || !isConnected) {
      return;
    }
    return (
      <BarChip text={network}>
        <img src={ethIcon} alt="eth" />
      </BarChip>
    );
  }
}

function cache<T>(key: string, value: T) {
  const data = JSON.stringify(value);
  window.localStorage.setItem(key, data);
}

function getCache<T>(key: string, defaultValue: T): T {
  const data = window.localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

export default App;
