import React from 'react';
import { useIntl } from 'react-intl';

import type { MenuOptionProps } from './menuItem';

type ColorOptionProps = MenuOptionProps & {
  icon?: React.ReactNode;
};

function ColorOption(props: ColorOptionProps): JSX.Element {
  const { id, name, icon } = props;
  const intl = useIntl();
  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      role='button'
      aria-label={intl.formatMessage(
        { id: 'ColorOption.selectColor', defaultMessage: 'Select {color} Color' },
        { color: name }
      )}
      className='MenuOption ColorOption menu-option'
      onClick={(e: React.MouseEvent): void => {
        e.target.dispatchEvent(new Event('menuItemClicked'));
        props.onClick(props.id);
      }}
    >
      {icon ?? <div className='noicon' />}
      <div className='menu-name'>{name}</div>
      <div className={`menu-colorbox ${id}`} />
    </div>
  );
}

export default React.memo(ColorOption);
