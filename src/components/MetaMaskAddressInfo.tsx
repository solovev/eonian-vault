import React from 'react';
import BarChip from './BarChip';
import metamaskIcon from '../icons/metamask.svg';

interface Props {
  account: string;
}

function MetaMaskAddressInfo({ account }: Props) {
  const address = React.useMemo(() => {
    const address = account;
    return address ? address.slice(0, 6) + '..' + address.slice(-5) : undefined;
  }, [account]);

  return (
    <BarChip text={address || 'Not connected'} title={account}>
      <img src={metamaskIcon} alt="metamask" />
    </BarChip>
  );
}

export default MetaMaskAddressInfo;
