import React from 'react';

type Props = {
    onChanged: (isOn: boolean) => void;
    isOn: boolean;
    readOnly?: boolean;
    disabled?: boolean;
}

// Switch is an on-off style switch / checkbox
function Switch (props: Props): JSX.Element {
  const className = props.isOn ? 'Switch on' : 'Switch';
  return (
    <div
      className={[className, props.disabled ? 'disabled' : ''].join(' ')}
      onClick={() => {
        if (!props.readOnly) {
          props.onChanged(!props.isOn);
        }
      }}
      style={{
      }}
    >
      <div className='octo-switch-inner' />
    </div>
  );
}

export default React.memo(Switch);
