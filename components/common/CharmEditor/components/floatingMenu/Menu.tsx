import styled from '@emotion/styled';
import { ClickAwayListener } from '@mui/material';
import Paper from '@mui/material/Paper';
import React from 'react';

import type { SubMenu } from './floating-menu';

const StyledMenu = styled(Paper, { shouldForwardProp: (prop: string) => prop !== 'noScroll' })<{
  type?: SubMenu;
  noScroll?: boolean;
  inline?: boolean;
}>`
  display: flex;
  padding: ${({ theme }) => theme.spacing(0, 0.5)};
  border-radius: 4px;
  ${({ theme, type }) =>
    type && ['defaultMenu', 'inlineCommentSubMenu'].includes(type) && theme.breakpoints.down('sm')} {
    ${({ inline, theme }) => !inline && `width: calc(100vw - ${theme.spacing(1)})`};
    margin: 0 ${({ theme }) => theme.spacing(0.5)};
    ${({ noScroll }) => (noScroll ? '' : 'overflow-x: auto')};
  }
`;

export function Menu({
  children,
  type,
  noScroll,
  inline
}: {
  children: React.ReactNode;
  type?: SubMenu;
  noScroll?: boolean;
  inline?: boolean;
}) {
  return (
    <StyledMenu elevation={8} type={type} noScroll={noScroll} inline={inline}>
      {children}
    </StyledMenu>
  );
}
