import React from 'react';

import Checkbox from '../checkbox';

import type { MenuOptionProps } from './menuItem';

type SwitchOptionProps = MenuOptionProps & {
  isOn: boolean;
  icon?: React.ReactNode;
};

function SwitchOption(props: SwitchOptionProps): JSX.Element {
  const { name, icon, isOn } = props;

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      className='MenuOption SwitchOption menu-option'
      role='button'
      aria-label={name}
      onClick={(e: React.MouseEvent) => {
        e.target.dispatchEvent(new Event('menuItemClicked'));
        props.onClick(props.id);
      }}
    >
      {icon && <div className='noicon' />}
      <div className='menu-name'>{name}</div>
      <Checkbox isOn={isOn} onChanged={() => {}} />
    </div>
  );
}

export default React.memo(SwitchOption);
