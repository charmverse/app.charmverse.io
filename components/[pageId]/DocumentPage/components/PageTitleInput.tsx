import { EditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { TextField, Typography } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { insertAndFocusFirstLine } from 'lib/prosemirror/insertAndFocusFirstLine';
import { isTouchScreen } from 'lib/utilities/browser';

const StyledPageTitle = styled(TextField)`
  &.MuiFormControl-root {
    width: 100%;
  }

  & .MuiInput-root {
    font-size: inherit;
  }

  & .MuiInput-input {
    background: transparent;
    border: 0 none;
    color: ${({ theme }) => theme.palette.text.primary};
    cursor: text;
    font-size: 2.4em;
    font-weight: 700;
    outline: none;
    line-height: 1.25em;
  }

  & .MuiInput-root:after {
    border: none;
  }

  & .MuiInput-root:before {
    border: none;
  }

  & .MuiInput-root:hover:not(.Mui-disabled):before {
    border: none;
  }
`;

export const StyledReadOnlyTitle = styled(Typography)`
  font-size: 40px;
  font-weight: 700;
`;

interface PageTitleProps {
  value: string;
  updatedAt?: string; // need this to determine if the title has been updated
  onChange: (page: { title: string; updatedAt: string }) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export function PageTitleInput({
  value,
  updatedAt: updatedAtExternal,
  onChange,
  readOnly,
  placeholder
}: PageTitleProps) {
  const view = useContext(EditorViewContext);
  const [title, setTitle] = useState(value);
  const titleInput = useRef(null);
  const [updatedAt, setUpdatedAt] = useState(updatedAtExternal);

  useEffect(() => {
    if (updatedAtExternal && updatedAt && updatedAt < updatedAtExternal) {
      setTitle(value);
    }
  }, [value, updatedAtExternal, updatedAt, setTitle]);

  function _onChange(event: ChangeEvent<HTMLInputElement>) {
    const newTitle = event.target.value;
    const _updatedAt = new Date().toISOString();
    setTitle(newTitle);
    setUpdatedAt(_updatedAt);
    onChange({ title: newTitle, updatedAt: _updatedAt });
  }

  if (readOnly) {
    return <StyledReadOnlyTitle data-test='editor-page-title'>{value || 'Untitled'}</StyledReadOnlyTitle>;
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        insertAndFocusFirstLine(view);
      }}
    >
      <StyledPageTitle
        className='page-title'
        data-test='editor-page-title'
        inputRef={titleInput}
        value={title}
        multiline
        placeholder={placeholder || 'Untitled'}
        autoFocus={!value && !readOnly && !isTouchScreen()}
        variant='standard'
        onChange={_onChange}
      />
    </form>
  );
}
