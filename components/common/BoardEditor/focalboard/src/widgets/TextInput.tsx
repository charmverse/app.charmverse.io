import styled from '@emotion/styled';
import { InputBase } from '@mui/material';
import React, { forwardRef, useRef } from 'react';

import type { EditableProps, Focusable } from './editable';
import { useEditable } from './editable';

export type TextInputProps = EditableProps & {
  className?: string;
  multiline?: boolean;
};

const StyledInput = styled(InputBase)`
  width: 100%;
  .MuiInputBase-input {
    box-sizing: border-box;
  }
  padding: 0; // disable padding added for multi-line input
  border: 0px;
`;

function Editable({ multiline, ..._props }: TextInputProps, ref: React.Ref<Focusable>): JSX.Element {
  const elementRef = useRef<HTMLTextAreaElement>(null);
  const { className, ...props } = useEditable(_props, ref, elementRef);
  return (
    <StyledInput
      inputProps={{
        className
      }}
      {...props}
      multiline={multiline}
    />
  );
}

export const TextInput = forwardRef(Editable);
