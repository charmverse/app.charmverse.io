import { styled } from '@mui/material';
import type { TextField } from '@mui/material';
import { InputBase, Tooltip } from '@mui/material';
import React, { forwardRef, useRef } from 'react';

import type { PropertyValueDisplayType } from '../../interfaces';
import type { EditableProps, Focusable } from '../../widgets/editable';
import { useEditable } from '../../widgets/editable';

import { PopupFieldWrapper } from './PopupFieldWrapper';

export type TextInputProps = EditableProps & {
  multiline?: boolean;
  displayType?: PropertyValueDisplayType;
  readOnlyMessage?: string;
  fullWidth?: boolean;
  wrapColumn?: boolean;
  columnRef?: React.RefObject<HTMLDivElement>;
  disablePopup?: boolean;
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

// Text Input from MUI with focalboard styles
export const StyledPropertyTextInput = StyledInput as typeof TextField;

function Editable(
  {
    multiline,
    columnRef,
    wrapColumn,
    displayType,
    fullWidth = true,
    sx,
    inputProps = {},
    readOnlyMessage,
    disablePopup,
    ..._props
  }: TextInputProps,
  ref: React.Ref<Focusable>
): JSX.Element {
  _props.className = 'octo-propertyvalue';
  const elementRef = useRef<HTMLTextAreaElement>(null);
  const { className, title, ...props } = useEditable(_props, ref, elementRef);
  const memoizedHeight = React.useMemo(() => {
    if (wrapColumn && columnRef?.current) {
      return `${columnRef?.current?.clientHeight}px`;
    }
    return 'fit-content';
  }, [wrapColumn, columnRef?.current]);

  // Keep it as before for card modal view
  if (displayType === 'details') {
    return (
      <Tooltip title={readOnlyMessage ?? null}>
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
      </Tooltip>
    );
  }

  return (
    <PopupFieldWrapper
      disabled={disablePopup || !!readOnlyMessage}
      height={memoizedHeight}
      paperSx={{ p: 1 }}
      previewField={
        <StyledInput
          inputProps={{
            ...inputProps,
            className
          }}
          fullWidth={fullWidth}
          {...props}
          multiline={multiline}
        />
      }
      activeField={
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
    />
  );
}

export const TextInput = forwardRef(Editable);
