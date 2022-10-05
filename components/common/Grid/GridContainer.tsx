import styled from '@emotion/styled';
import { Grid } from '@mui/material';
import type { ComponentProps } from 'react';

const StyledGrid = styled(Grid)`

  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};

  &:hover {
    background-color: rgba(var(--center-channel-color-rgb),.05);
  }

  .show-on-hover {
    visibility: hidden;
  }
  &:hover .show-on-hover {
    visibility: visible;
  }
`;

export default function GridContainer ({ children, ...props }: ComponentProps<typeof Grid>) {
  return (
    <StyledGrid container justifyContent='space-between' alignItems='center' {...props}>
      {children}
    </StyledGrid>
  );
}
