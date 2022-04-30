import React from 'react';
import styles from './sidebar.module.scss';
import daiIcon from '../icons/dai.svg';
import usdtIcon from '../icons/usdt.svg';
import classNames from 'classnames';

interface Item {
  icon: string;
  name: string;
}

const items: Item[] = [
  { icon: daiIcon, name: 'DAI' },
  { icon: usdtIcon, name: 'USDT' },
];

function SideBar() {
  return (
    <div className={styles.container}>
      {items.map((item, index) => {
        return renderItem(item.name, item.icon, index === 0);
      })}
    </div>
  );

  function renderItem(name: string, icon: string, isSelected: boolean) {
    const className = classNames(styles.item, { [styles['item--selected']]: isSelected }, { [styles['item--disabled']]: !isSelected });
    return (
      <div key={name} className={className}>
        <img src={icon} alt={name} />
        {name}
      </div>
    );
  }
}

export default SideBar;
