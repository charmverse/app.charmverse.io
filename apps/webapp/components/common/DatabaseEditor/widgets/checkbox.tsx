import styled from '@emotion/styled';
import { Typography, Checkbox, FormControlLabel } from '@mui/material';
import clsx from 'clsx';
import React from 'react';

import type { PropertyValueDisplayType } from '../interfaces';

const StyledFormControlLabel = styled(FormControlLabel)`
  // full width for card properties view
  width: 100%;
  // full height to vertically center in table view
  height: 100%;
  .MuiFormControlLabel-label {
    width: 100%;
  }
`;

type Props = {
  onChanged: (isOn: boolean) => void;
  isOn: boolean;
  displayType?: PropertyValueDisplayType;
  label?: string;
  readOnly?: boolean;
  disabled?: boolean;
};

// Switch is an on-off style switch / checkbox
function Switch(props: Props): JSX.Element {
  const { displayType } = props;
  const isCardView = displayType === 'kanban' || displayType === 'gallery' || displayType === 'calendar';
  return (
    <StyledFormControlLabel
      className={clsx('octo-propertyvalue', { readonly: props.disabled })}
      label={
        <Typography fontSize={14} sx={{ pl: 1 }}>
          {isCardView ? props.label : <>&nbsp;</>}
        </Typography>
      }
      sx={{ m: 0 }}
      control={
        <Checkbox
          checked={!!props.isOn}
          disableRipple
          size={isCardView ? 'small' : 'medium'}
          disabled={props.disabled}
          sx={{ p: 0 }}
          onChange={() => {
            if (!props.readOnly) {
              props.onChanged(!props.isOn);
            }
          }}
        />
      }
    />
  );
}

export default React.memo(Switch);
