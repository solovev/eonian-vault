import classNames from 'classnames';
import { observer } from 'mobx-react';
import React, { useMemo } from 'react';
import { getSharesOfAmount } from '../store/Getters';
import store from '../store/MainStore';
import TransferCard from './cards/TransferCard';
import Values from './cards/Values';
import styles from './content.module.scss';

function Content() {
  const [depositValue, setDepositValue] = React.useState(0);
  const [withdrawValue, setWithdrawValue] = React.useState(0);

  const [isInDepositing, setInDepositing] = React.useState(false);
  const [isInWithdrawing, setInWithdrawing] = React.useState(false);

  const sharesToGet = useMemo(() => getSharesOfAmount(depositValue), [depositValue]);
  const sharesToReturn = useMemo(() => getSharesOfAmount(withdrawValue), [withdrawValue]);

  const handleDeposit = React.useCallback(async () => {
    setInDepositing(true);

    await store.deposit(depositValue);

    setInDepositing(false);
  }, [depositValue]);

  const handleWithdraw = React.useCallback(async () => {
    setInWithdrawing(true);

    await store.withdraw(withdrawValue);

    setInWithdrawing(false);
  }, [withdrawValue]);

  return (
    <div className={styles.container}>
      <ContentCard className={styles.deposit} title="Deposit">
        <TransferCard
          shares={sharesToGet}
          onApply={handleDeposit}
          onAmountChanged={setDepositValue}
          renderMessage={(shares: number) => `You will receive ${shares} shares`}
          maxValue={+store.walletDaiBalance}
          isLoading={isInDepositing}
          disabled={isInWithdrawing}
        />
      </ContentCard>
      <ContentCard className={styles.withdraw} title="Withdraw">
        <TransferCard
          shares={sharesToReturn}
          onApply={handleWithdraw}
          onAmountChanged={setWithdrawValue}
          renderMessage={(shares: number) => `You will return ${shares} shares`}
          maxValue={+store.walletShares}
          isLoading={isInWithdrawing}
          disabled={isInDepositing}
        />
      </ContentCard>
      <ContentCard className={styles.stats}>
        <Values />
      </ContentCard>
    </div>
  );
}

interface ContentCardProps {
  title?: string;
  className: string;
  children?: React.ReactNode;
}

function ContentCard({ title, className, children }: ContentCardProps) {
  return (
    <div className={classNames(styles.card, className)}>
      {title && <header>{title}</header>}
      <section>{children}</section>
    </div>
  );
}

export default observer(Content);
