import React from 'react';
import styles from './values.module.scss';

function Values() {
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
            <td>0</td>
          </tr>
          <tr>
            <td>DAI FS Balance</td>
            <td>0</td>
          </tr>
          <tr>
            <td>DAI Vault Balance</td>
            <td>0</td>
          </tr>
          <tr>
            <td>DAI Wallet Balance</td>
            <td>0</td>
          </tr>
          <tr>
            <td>Comp. FS Balance</td>
            <td>0</td>
          </tr>
          <tr>
            <td>Vault Shares</td>
            <td>0</td>
          </tr>
          <tr>
            <td>Wallet Shares</td>
            <td>0</td>
          </tr>
          <tr>
            <td>ETH Wallet Balance</td>
            <td>0</td>
          </tr>
          <tr>
            <td>Supply Rate</td>
            <td>0</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Values;
