import { memo } from 'react';
import { alpha } from '@mui/material';
import styled from '@emotion/styled';

const StyledPlaceholder = styled.div`
  top: -2em;
  position: relative;
  color: ${({ theme }) => alpha(theme.palette.text.secondary, 0.5)};
  // Place it beneath the actual editor
  z-index: -20;
`;

function PlaceHolder ({ show }: { show: boolean }) {
  return show ? (
    <StyledPlaceholder>
      Type '/' for commands
    </StyledPlaceholder>
  ) : null;
}

export default memo(PlaceHolder);
