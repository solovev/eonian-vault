import React from 'react';
import BarChip from './BarChip';
import metamaskIcon from '../icons/metamask.svg';

interface Props {
  accounts: string[];
}

function MetaMaskAddressInfo({ accounts }: Props) {
  const firstAddress = accounts[0];

  const address = React.useMemo(() => {
    const address = firstAddress;
    return address ? address.slice(0, 6) + '..' + address.slice(-5) : undefined;
  }, [firstAddress]);

  return (
    <BarChip text={address ?? 'Not connected'} title={firstAddress}>
      <img src={metamaskIcon} alt="metamask" />
    </BarChip>
  );
}

export default MetaMaskAddressInfo;
