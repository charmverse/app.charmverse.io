import styled from '@emotion/styled';
// eslint-disable-next-line import/no-extraneous-dependencies
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { InputBase } from '@mui/material';
import React, { forwardRef, useRef } from 'react';

import type { EditableProps, Focusable } from './editable';
import { useEditable } from './editable';

export type TextInputProps = EditableProps & {
  className?: string;
  maxRows?: number;
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

const StyledAutosize = styled(TextareaAutosize)`
  resize: none;
  width: 100%;
  .MuiInputBase-input {
    box-sizing: border-box;
  }
  padding: 0; // disable padding added for multi-line input
  border: 0px;
`;

export const TextAreaAutoSize = forwardRef(
  (props: EditableProps & { onChange: (value: string) => void }, ref: React.Ref<Focusable>) => {
    const elementRef = useRef<HTMLTextAreaElement>(null);
    const editableProps = useEditable(props, ref, elementRef);
    return <StyledAutosize value={props.value} {...editableProps} />;
  }
);

function Editable({ maxRows, multiline, ..._props }: TextInputProps, ref: React.Ref<Focusable>): JSX.Element {
  const elementRef = useRef<HTMLTextAreaElement>(null);
  const { className, ...props } = useEditable(_props, ref, elementRef);
  return (
    <StyledInput
      inputProps={{
        className,
        maxRows
      }}
      {...props}
      multiline={multiline}
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

export const TextInput = forwardRef(Editable);
