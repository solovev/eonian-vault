import React from 'react';
import styles from './info-top-bar.module.scss';

interface Props {
  startElement?: React.ReactNode;
  endElement?: React.ReactNode;
}

function InfoTopBar({ startElement, endElement }: Props) {
  return (
    <div className={styles.container}>
      {startElement && <div className={styles.group}>{startElement}</div>}
      {endElement && <div className={styles.group + ' ' + styles.end}>{endElement}</div>}
    </div>
  );
}

export default InfoTopBar;
