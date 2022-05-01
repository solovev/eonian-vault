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

import store, { ethereum } from './store/MainStore';
import { observer } from 'mobx-react';

function App() {
  const { account, network } = store;

  const handleAccountsChanged = React.useCallback((accounts: string[]) => {
    store.setAccounts(accounts);
  }, []);

  React.useEffect(() => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      ethereum.request({ method: 'eth_requestAccounts' }).then(handleAccountsChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, [handleAccountsChanged]);

  const isConnected = React.useMemo(() => !!account, [account]);

  return (
    <div className="main-container">
      <div className="sub-container">
        <InfoTopBar
          startElement={
            isConnected && (
              <>
                <BarChip text="Total Balance: 0 USD" />
                <BarChip text="Total APY: 0 %" />
                <BarChip text="Daily Income: 0 USD" />
              </>
            )
          }
          endElement={
            <>
              {renderNetwork()}
              <MetaMaskAddressInfo account={account} />
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

export default observer(App);
