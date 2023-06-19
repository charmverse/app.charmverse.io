import styled from '@emotion/styled';
import { InputBase } from '@mui/material';
import React, { forwardRef, useRef } from 'react';

import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import PopperPopup from 'components/common/PopperPopup';

import type { EditableProps, Focusable } from './editable';
import { useEditable } from './editable';

export type TextInputProps = EditableProps & {
  className?: string;
  multiline?: boolean;
  displayType?: PropertyValueDisplayType;
  wrapColumn?: boolean;
  columnRef?: React.RefObject<HTMLDivElement>;
};

const StyledInput = styled(InputBase)`
  width: 100%;
  .MuiInputBase-input {
    box-sizing: border-box;
  }
  padding: 0; // disable padding added for multi-line input
  border: 0px;
`;

function Editable(
  { multiline, columnRef, wrapColumn, displayType, ..._props }: TextInputProps,
  ref: React.Ref<Focusable>
): JSX.Element {
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
          className
        }}
        {...props}
        fullWidth
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
            className
          }}
          {...props}
          inputRef={(input) => input && input.focus()}
          onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          multiline
        />
      }
    >
      <StyledInput
        inputProps={{
          className
        }}
        {...props}
        fullWidth
        multiline={multiline}
      />
    </PopperPopup>
  );
}

export const TextInput = forwardRef(Editable);
