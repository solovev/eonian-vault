import classNames from 'classnames';
import React from 'react';
import Button from '../Button';
import InputField from '../InputFIeld';
import Loading from '../Loading';
import styles from './transfer-card.module.scss';

interface Props {
  shares: number;
  onApply: () => void;
  onAmountChanged: (value: number) => void;
  renderMessage: (shares: number) => string;
  maxValue?: number | string;
  isLoading?: boolean;
  disabled?: boolean;
}

function TransferCard({ shares, maxValue, onApply, onAmountChanged, renderMessage, disabled, isLoading }: Props) {
  const [amount, setAmount] = React.useState('');
  const isDisabled = disabled || isLoading || +amount <= 0;

  const handleAmountChanged = React.useCallback(
    (value: string) => {
      if (maxValue !== undefined && +value > +maxValue) {
        value = String(maxValue);
      }

      if (+value < 0) {
        value = '0';
      }

      setAmount(value);
      onAmountChanged(+value);
    },
    [onAmountChanged, maxValue],
  );

  return (
    <div>
      <InputField
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChangeValue={handleAmountChanged}
        max={maxValue}
        disabled={isLoading || disabled}
      />
      <div className={styles.row}>
        <div className={classNames(styles.shares, { [styles['shares--disabled']]: isDisabled })}>
          {renderMessage(isDisabled ? 0 : shares)}
        </div>
        {isLoading ? (
          <div className={styles.loading}>
            <Loading size={32} />
          </div>
        ) : (
          <Button disabled={isDisabled} className={styles.apply} onClick={onApply}>
            Apply
          </Button>
        )}
      </div>
    </div>
  );
}

export default TransferCard;
