import classNames from 'classnames';
import React from 'react';
import styles from './input-field.module.scss';

interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  value: string;
  onChangeValue: (value: string) => void;
}

function InputField({ value, onChangeValue, onFocus, onBlur, ...restProps }: Props) {
  const [isFocused, setFocused] = React.useState(false);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = React.useCallback(
    (event) => {
      onChangeValue(event.target.value);
    },
    [onChangeValue],
  );

  const handleFocus: React.FocusEventHandler<HTMLInputElement> = React.useCallback(
    (event) => {
      setFocused(true);
      onFocus?.(event);
    },
    [setFocused, onFocus],
  );

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = React.useCallback(
    (event) => {
      setFocused(false);
      onBlur?.(event);
    },
    [setFocused, onBlur],
  );

  return (
    <div className={classNames(styles.container, { [styles['container--focused']]: isFocused })}>
      <input value={value} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} {...restProps} />
    </div>
  );
}

export default InputField;
