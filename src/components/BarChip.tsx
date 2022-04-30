import React from 'react';
import styles from './bar-chip.module.scss';

interface Props {
  text: string;
  title?: string;
  children?: React.ReactNode;
}

function BarChip({ text, title, children }: Props) {
  return (
    <div className={styles.container} title={title ?? text}>
      {children}
      <div className={styles.content}>{text}</div>
    </div>
  );
}

export default BarChip;
