import styled from '@emotion/styled';
import { Grid } from '@mui/material';
import type { ComponentProps } from 'react';

const StyledGrid = styled(Grid)`

  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  width: 100%;
  padding-top: ${({ theme }) => theme.spacing(2)};
  padding-bottom: ${({ theme }) => theme.spacing(2)};

  &:last-child {
    border-bottom: 0 none;
  }
`;

export default function GridContainer ({ children, ...props }: ComponentProps<typeof Grid>) {
  return (
    <StyledGrid item {...props}>
      {children}
    </StyledGrid>
  );
}
