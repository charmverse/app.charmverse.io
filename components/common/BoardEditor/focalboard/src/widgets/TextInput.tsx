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
`;

function EditableArea(_props: TextInputProps, ref: React.Ref<Focusable>): JSX.Element {
  const elementRef = useRef<HTMLTextAreaElement>(null);
  const props = useEditable(_props, ref, elementRef);
  return (
    <StyledInput
      inputProps={{
        className: props.className
      }}
      onChange={props.onChange}
      multiline={_props.multiline}
      value={props.value}
      placeholder={props.placeholder}
      readOnly={props.readOnly}
      spellCheck={props.spellCheck}
      // props from Editable that are not implemented
      // saveOnEsc
      //   autoExpand?: boolean;
      //  validator?: (value: string) => boolean;
      // onCancel?: () => void;
      // onSave?: (saveType: 'onEnter' | 'onEsc' | 'onBlur') => void;
      // onFocus?: () => void;
    />
  );
}

export const TextProperty = forwardRef(EditableArea);
