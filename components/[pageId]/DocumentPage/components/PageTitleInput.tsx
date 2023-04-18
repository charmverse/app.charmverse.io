import { EditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { TextField, Typography } from '@mui/material';
import type { ChangeEvent } from 'react';
import { useContext, useEffect, useRef, useState } from 'react';

import { insertAndFocusFirstLine } from 'lib/prosemirror/insertAndFocusFirstLine';
import { isTouchScreen } from 'lib/utilities/browser';

const StyledPageTitle = styled(TextField)`
  &.MuiFormControl-root {
    width: 100%;
  }

  & .MuiInput-input {
    background: transparent;
    border: 0 none;
    color: ${({ theme }) => theme.palette.text.primary};
    cursor: text;
    font-size: 40px;
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

const StyledReadOnlyTitle = styled(Typography)`
  font-size: 40px;
  font-weight: 700;
`;

interface PageTitleProps {
  value: string;
  updatedAt?: string; // need this to determine if the title has been updated
  onChange: (page: { title: string; updatedAt: string }) => void;
  readOnly?: boolean;
}

export function PageTitleInput({ value, updatedAt: updatedAtExternal, onChange, readOnly }: PageTitleProps) {
  const view = useContext(EditorViewContext);
  const [title, setTitle] = useState(value);
  const titleInput = useRef(null);
  const [updatedAt, setUpdatedAt] = useState(updatedAtExternal);

  useEffect(() => {
    if (updatedAtExternal && updatedAt && updatedAt < updatedAtExternal) {
      setTitle(value);
    }
  }, [value, updatedAtExternal]);

  function _onChange(event: ChangeEvent<HTMLInputElement>) {
    const _title = event.target.value;
    const _updatedAt = new Date().toISOString();
    setTitle(_title);
    setUpdatedAt(_updatedAt);
    onChange({ title: _title, updatedAt: _updatedAt });
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
        onChange={_onChange}
        placeholder='Untitled'
        autoFocus={!value && !readOnly && !isTouchScreen()}
        variant='standard'
      />
    </form>
  );
}
