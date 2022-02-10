import { EditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { ChangeEvent, useContext } from 'react';

const StyledPageTitle = styled.input`
  background: transparent;
  border: 0 none;
  color: ${({ theme }) => theme.palette.text.primary};
  cursor: text;
  font-size: 40px;
  font-weight: 700;
  outline: none;
`;

interface PageTitleProps {
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function PageTitle ({ value, onChange }: PageTitleProps) {
  const view = useContext(EditorViewContext);
  return (
    <StyledPageTitle
      value={value}
      onChange={onChange}
      placeholder='Untitled'
      autoFocus
      onKeyDown={(e) => {
        if (e.code === 'Enter') {
          view.focus();
        }
      }}
    />
  );
}
