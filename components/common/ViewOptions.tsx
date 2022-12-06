import styled from '@emotion/styled';
import type { SxProps } from '@mui/material';
import { InputLabel, Stack } from '@mui/material';
import type { ReactNode } from 'react';

export const StyledViewOptions = styled(Stack)`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(1)};
  .MuiInputLabel-root,
  .MuiSelect-select {
    font-size: 0.85em;
  }
`;

export function ViewOptions({ children, label, sx = {} }: { children: ReactNode; label: string; sx?: SxProps }) {
  return (
    <StyledViewOptions sx={sx}>
      <InputLabel>{label}</InputLabel>
      {children}
    </StyledViewOptions>
  );
}
