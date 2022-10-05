import styled from '@emotion/styled';
import { Grid } from '@mui/material';
import type { ComponentProps } from 'react';

const StyledGrid = styled(Grid)`

  // typography taken from focalboard styles
  color: rgba(var(--center-channel-color-rgb), 0.6);
  font-size: 0.85rem;
  font-weight: 600;
  padding: ${({ theme }) => theme.spacing(1, 2)};

  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  width: 100%;
`;

export default function GridContainer ({ children, ...props }: ComponentProps<typeof Grid>) {
  return (
    <StyledGrid container alignItems='flex-end' {...props}>
      {children}
    </StyledGrid>
  );
}
