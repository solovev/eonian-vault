import classNames from 'classnames';
import React from 'react';
import Button from '../Button';
import InputField from '../InputFIeld';
import styles from './transfer-card.module.scss';

interface Props {
  shares: number;
  onApply: () => void;
  onAmountChanged: (value: number) => void;
  renderMessage: (shares: number) => string;
}

function TransferCard({ shares, onApply, onAmountChanged, renderMessage }: Props) {
  const [amount, setAmount] = React.useState('');
  const isDisabled = +amount <= 0;

  const handleAmountChanged = React.useCallback(
    (value: string) => {
      setAmount(value);
      onAmountChanged(+value);
    },
    [onAmountChanged],
  );

  return (
    <div>
      <InputField type="number" placeholder="Enter amount" value={amount} onChangeValue={handleAmountChanged} />
      <div className={styles.row}>
        <div className={classNames(styles.shares, { [styles['shares--disabled']]: isDisabled })}>
          {renderMessage(isDisabled ? 0 : shares)}
        </div>
        <Button disabled={isDisabled} className={styles.apply} onClick={onApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}

export default TransferCard;
