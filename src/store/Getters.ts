import store from './MainStore';

export function getSharesOfAmount(amount: number): number {
  const totalSupply = +store.totalShares;
  if (totalSupply <= 0) {
    return amount;
  }

  const tlv = +store.vaultTotalBalance || 100;
  if (tlv === 0) {
    return 0;
  }
  return (amount / tlv) * totalSupply;
}
