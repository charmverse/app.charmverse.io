'use client';

import { styled, IconButton as MuiIconButton } from '@mui/material';

export const IconButton = styled(MuiIconButton)`
  ${({ theme }) =>
    `
     min-width: 64px;
     color: ${theme.palette.text.secondary};
     border: 1px solid ${theme.palette.secondary.main};
     border-radius: ${theme.shape.borderRadius}px;
     padding: 2px;
    `}
`;
