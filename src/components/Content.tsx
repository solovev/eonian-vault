import classNames from 'classnames';
import React from 'react';
import TransferCard from './cards/TransferCard';
import Values from './cards/Values';
import styles from './content.module.scss';

function Content() {
  return (
    <div className={styles.container}>
      <ContentCard className={styles.deposit} title="Deposit">
        <TransferCard
          shares={0}
          onApply={() => {}}
          onAmountChanged={(value: number) => {}}
          renderMessage={(shares: number) => `You will receive ${shares} shares`}
        />
      </ContentCard>
      <ContentCard className={styles.withdraw} title="Withdraw">
        <TransferCard
          shares={0}
          onApply={() => {}}
          onAmountChanged={(value: number) => {}}
          renderMessage={(shares: number) => `You will return ${shares} shares`}
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

export default Content;
