import styled from '@emotion/styled';
import React from 'react';
import Paper from '@mui/material/Paper';

const StyledMenu = styled(Paper)`
  display: flex;
  padding: ${({ theme }) => theme.spacing(0.75, 0.5)};
`;

export function Menu ({
  className = '',
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <StyledMenu className={className} elevation={8}>
      {children}
    </StyledMenu>
  );
}
