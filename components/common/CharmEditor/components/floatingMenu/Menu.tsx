import styled from '@emotion/styled';
import Paper from '@mui/material/Paper';
import React from 'react';

import type { SubMenu } from './floating-menu';

const StyledMenu = styled(Paper)<{ type?: SubMenu }>`
  display: flex;
  padding: ${({ theme }) => theme.spacing(0, 0.5)};
  border-radius: 4px;
  ${({ theme, type }) => type === 'defaultMenu' && theme.breakpoints.down('sm')} {
    width: 100vw;
    overflow-x: auto;
  }
`;

export function Menu({ children, type }: { children: React.ReactNode; type?: SubMenu }) {
  return (
    <StyledMenu elevation={8} type={type}>
      {children}
    </StyledMenu>
  );
}
