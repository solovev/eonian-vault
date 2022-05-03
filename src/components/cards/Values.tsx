import { observer } from 'mobx-react';
import React from 'react';
import store from '../../store/MainStore';
import styles from './values.module.scss';

function Values() {
  const formatNumberDecimals = (n: string): string => {
    const num = +n;
    return num > 0 ? num.toFixed(3) : n;
  };

  return (
    <div className={styles.container}>
      <table cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <td>Parameter name</td>
            <td>Value</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>DAI FS APY</td>
            <td>{store.apy} %</td>
          </tr>
          <tr>
            <td>DAI FS Balance</td>
            <td>{store.fsDaiBalance}</td>
          </tr>
          <tr>
            <td>DAI Vault Balance</td>
            <td>{store.vaultDaiBalance}</td>
          </tr>
          <tr>
            <td>DAI Wallet Balance</td>
            <td>{store.walletDaiBalance}</td>
          </tr>
          <tr>
            <td>Comp. FS Balance</td>
            <td>{store.fsCdaiBalance}</td>
          </tr>
          <tr>
            <td>Wallet/Vault Shares</td>
            <td>
              {formatNumberDecimals(store.walletShares)} / {formatNumberDecimals(store.totalShares)}
            </td>
          </tr>
          <tr>
            <td>ETH Wallet Balance</td>
            <td>{store.walletEthBalance}</td>
          </tr>
          <tr>
            <td>Supply Rate</td>
            <td>{store.supplyRatePerBlock}</td>
          </tr>
          <tr>
            <td>Total Locked Value</td>
            <td>{store.vaultTotalBalance}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default observer(Values);
