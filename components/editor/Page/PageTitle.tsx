import { EditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { TextField } from '@mui/material';
import { useTheme } from '@mui/system';
import { TextSelection } from 'prosemirror-state';
import { ChangeEvent, useContext } from 'react';

const StyledPageTitle = styled(TextField)`
  
`;

interface PageTitleProps {
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function PageTitle ({ value, onChange }: PageTitleProps) {
  const view = useContext(EditorViewContext);
  const theme = useTheme();

  return (
    <StyledPageTitle
      value={value}
      onChange={onChange}
      placeholder='Untitled'
      autoFocus
      multiline
      variant='standard'
      sx={{
        '&.MuiFormControl-root': {
          width: '100%'
        },
        '& .MuiInput-input': {
          background: 'transparent',
          border: '0 none',
          color: theme.palette.text.primary,
          cursor: 'text',
          fontSize: 40,
          fontWeight: 700,
          outline: 'none',
          lineHeight: '1.5em'
        },
        '& .MuiInput-root:after': {
          border: 'none'
        },
        '& .MuiInput-root:before': {
          border: 'none'
        },
        '& .MuiInput-root:hover:not(.Mui-disabled):before': {
          border: 'none'
        }
      }}
      onKeyDown={(e) => {
        if (e.code === 'Enter') {
          // prevent inserting a new line into the editor
          e.preventDefault();
          const { tr } = view.state;
          // set cursor at beginning of first line
          view.dispatch(tr.setSelection(TextSelection.atStart(tr.doc)));
          view.focus();
        }
      }}
    />
  );
}
