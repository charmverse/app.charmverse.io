import styled from '@emotion/styled';
import { InputBase } from '@mui/material';
import React, { forwardRef, useRef } from 'react';

import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import PopperPopup from 'components/common/PopperPopup';

import type { EditableProps, Focusable } from '../../focalboard/src/widgets/editable';
import { useEditable } from '../../focalboard/src/widgets/editable';

export type TextInputProps = EditableProps & {
  multiline?: boolean;
  displayType?: PropertyValueDisplayType;
  fullWidth?: boolean;
  wrapColumn?: boolean;
  columnRef?: React.RefObject<HTMLDivElement>;
  inputProps?: any;
  sx?: any;
};

const StyledInput = styled(InputBase)`
  .MuiInputBase-input {
    box-sizing: border-box;
  }
  padding: 0; // disable padding added for multi-line input
  border: 0px;
  .octo-propertyvalue:not(.readonly) {
    cursor: text !important;
  }

  // disable up/down arrows on number input to preserve space https://www.w3schools.com/howto/howto_css_hide_arrow_number.asp

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
  }
`;

function Editable(
  { multiline, columnRef, wrapColumn, displayType, fullWidth = true, sx, inputProps = {}, ..._props }: TextInputProps,
  ref: React.Ref<Focusable>
): JSX.Element {
  _props.className = 'octo-propertyvalue';
  const elementRef = useRef<HTMLTextAreaElement>(null);
  const { className, ...props } = useEditable(_props, ref, elementRef);
  const memoizedHeight = React.useMemo(() => {
    if (wrapColumn && columnRef?.current) {
      return `${columnRef?.current?.clientHeight}px`;
    }
    return 'fit-content';
  }, [wrapColumn, columnRef?.current]);

  // Keep it as before for card modal view
  if (displayType === 'details') {
    return (
      <StyledInput
        inputProps={{
          ...inputProps,
          className
        }}
        fullWidth={fullWidth}
        sx={sx}
        {...props}
        multiline={multiline}
      />
    );
  }

  return (
    <PopperPopup
      style={{ width: '100%' }}
      paperSx={{
        width: 350,
        p: 2,
        height: memoizedHeight
      }}
      popoverProps={{
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left'
        },
        transformOrigin: {
          vertical: 'bottom',
          horizontal: 'left'
        }
      }}
      popupContent={
        <StyledInput
          inputProps={{
            ...inputProps,
            className
          }}
          fullWidth={fullWidth}
          sx={sx}
          {...props}
          inputRef={(input) => input && input.focus()}
          onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          multiline
        />
      }
    >
      <StyledInput
        inputProps={{
          ...inputProps,
          className
        }}
        fullWidth={fullWidth}
        {...props}
        multiline={multiline}
      />
    </PopperPopup>
  );
}

export const TextInput = forwardRef(Editable);
