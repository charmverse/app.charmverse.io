import React from 'react';

import Switch from '../switch';

import { MenuOptionProps } from './menuItem';

type SwitchOptionProps = MenuOptionProps & {
    isOn: boolean,
    icon?: React.ReactNode,
}

function SwitchOption (props: SwitchOptionProps): JSX.Element {
  const { name, icon, isOn } = props;

  return (
    <div
      className='MenuOption SwitchOption menu-option'
      role='button'
      aria-label={name}
      onClick={(e: React.MouseEvent) => {
        e.target.dispatchEvent(new Event('menuItemClicked'));
        props.onClick(props.id);
      }}
    >
      {icon ?? <div className='noicon' />}
      <div className='menu-name'>{name}</div>
      <Switch
        isOn={isOn}
        onChanged={() => {}}
      />
    </div>
  );
}

export default React.memo(SwitchOption);
