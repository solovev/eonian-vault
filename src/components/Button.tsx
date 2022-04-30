import classNames from 'classnames';
import React from 'react';
import styles from './button.module.scss';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  children: React.ReactNode;
}

function Button({ children, className, ...restProps }: Props) {
  return (
    <button className={classNames(styles.button, className)} {...restProps}>
      {children}
    </button>
  );
}

export default Button;
