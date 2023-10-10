import type { SxProps, Theme } from '@mui/material';
import { Box } from '@mui/material';
import React from 'react';

type Props = {
  onChanged: (isOn: boolean) => void;
  isOn: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  sx?: SxProps<Theme>;
};

// Switch is an on-off style switch / checkbox
function Switch(props: Props): JSX.Element {
  const className = props.isOn ? 'Switch on' : 'Switch';
  return (
    <Box
      sx={props.sx}
      className={[className, props.disabled ? 'disabled' : ''].join(' ')}
      onClick={() => {
        if (!props.readOnly) {
          props.onChanged(!props.isOn);
        }
      }}
    >
      <div className='octo-switch-inner' />
    </Box>
  );
}

export default React.memo(Switch);
