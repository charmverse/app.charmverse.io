import { styled } from '@mui/material';
import { TextField, Typography } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { useIMEComposition } from 'hooks/useIMEComposition';
import { isTouchScreen } from '@packages/lib/utils/browser';

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
  focusDocumentEditor: VoidFunction;
}

export function PageTitleInput({
  value,
  updatedAt: updatedAtExternal,
  onChange,
  readOnly,
  placeholder,
  focusDocumentEditor
}: PageTitleProps) {
  // const view = useContext(EditorViewContext);
  const [title, setTitle] = useState(value);
  const [updatedAt, setUpdatedAt] = useState(updatedAtExternal);
  const titleInput = useRef<HTMLTextAreaElement>(null);
  const { isOrWasComposing } = useIMEComposition(titleInput);

  function _onChange(event: ChangeEvent<HTMLInputElement>) {
    const newTitle = event.target.value;
    const _updatedAt = new Date().toISOString();
    setTitle(newTitle);
    setUpdatedAt(_updatedAt);
    onChange({ title: newTitle, updatedAt: _updatedAt });
  }
  const onKeyUp: TextFieldProps['onKeyUp'] = (event) => {
    // do not submit if user is/was entering Japanese characters
    if (isOrWasComposing) {
      return;
    }
    // Follow Notion where holding ctrlKey/shift does nothing
    const metaKey = event.ctrlKey || event.shiftKey;
    if (metaKey) {
      return;
    }
    const pressedEnter = event.key === 'Enter';
    if (pressedEnter) {
      event.preventDefault();
      focusDocumentEditor();
    }
  };

  // listen to keyDown to prevent "Enter" from being used to insert a new line
  const onKeyDown: TextFieldProps['onKeyDown'] = (event) => {
    const pressedEnter = event.key === 'Enter';
    if (pressedEnter) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    if (updatedAtExternal && updatedAt && updatedAt < updatedAtExternal) {
      setTitle(value);
    }
  }, [value, updatedAtExternal, updatedAt, setTitle]);

  if (readOnly) {
    return (
      <StyledReadOnlyTitle variant='h1' data-test='editor-page-title'>
        {value || 'Untitled'}
      </StyledReadOnlyTitle>
    );
  }
  return (
    <StyledPageTitle
      className='page-title'
      data-test='editor-page-title'
      inputRef={titleInput}
      value={title}
      placeholder={placeholder || 'Untitled'}
      autoFocus={!value && !readOnly && !isTouchScreen()}
      variant='standard'
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      // Note: we use multiline/textarea to wrap long titles
      // This means we can't use form submit events to respond to "Enter key"
      multiline
      onChange={_onChange}
    />
  );
}
