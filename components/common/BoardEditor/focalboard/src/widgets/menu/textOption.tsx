import React from 'react';

import type { MenuOptionProps } from './menuItem';

type TextOptionProps = MenuOptionProps & {
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    className?: string;
}

function TextOption (props:TextOptionProps): JSX.Element {
  const { name, icon, rightIcon } = props;
  let className = 'MenuOption TextOption menu-option';
  if (props.className) {
    className += ` ${props.className}`;
  }
  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      role='button'
      aria-label={name}
      className={className}
      onClick={(e: React.MouseEvent) => {
        e.target.dispatchEvent(new Event('menuItemClicked'));
        props.onClick(props.id);
      }}
    >
      {icon ?? <div className='noicon' />}
      <div className='menu-name'>{name}</div>
      {rightIcon ?? <div className='noicon' />}
    </div>
  );
}

export default React.memo(TextOption);
