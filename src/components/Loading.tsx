import React from 'react';
import styles from './loading.module.scss';

interface Props {
  size?: number;
}

function Loading({ size = 40 }: Props) {
  return <div className={styles.loader} style={{ height: `${size}px`, width: `${size}px` }} />;
}

export default Loading;
