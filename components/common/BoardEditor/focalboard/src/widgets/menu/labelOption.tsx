import React from 'react';

type LabelOptionProps = {
  icon?: string;
  children: React.ReactNode;
};

function LabelOption(props: LabelOptionProps): JSX.Element {
  return (
    <div className='MenuOption LabelOption menu-option'>
      {props.icon ?? <div className='noicon' />}
      <div className='menu-name'>{props.children}</div>
      <div className='noicon' />
    </div>
  );
}

export default React.memo(LabelOption);
