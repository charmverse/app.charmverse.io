import { useEditorViewContext } from '@bangle.dev/react';
import { alpha } from '@mui/material';
import styled from '@emotion/styled';
import { useEffect } from 'react';

const StyledPlaceholder = styled.div`
  top: -2em;
  position: relative;
  color: ${({ theme }) => alpha(theme.palette.text.secondary, 0.5)};
  // Place it beneath the actual editor
  z-index: -20;
`;

export default function PlaceHolder ({ show }: { show: boolean }) {
  const view = useEditorViewContext();
  return show ? (
    <StyledPlaceholder>
      Type '/' for commands
    </StyledPlaceholder>
  ) : null;
}
