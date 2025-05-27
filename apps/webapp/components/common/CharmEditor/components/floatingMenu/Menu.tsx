import { styled } from '@mui/material';
import Paper from '@mui/material/Paper';
import React from 'react';

import type { SubMenu } from './floatingMenuPlugin';

const StyledMenu = styled(Paper, { shouldForwardProp: (prop: string) => prop !== 'noScroll' })<{
  type?: SubMenu;
  noScroll?: boolean;
  inline?: boolean;
}>`
  display: flex;
  border-radius: 4px;
  ${({ theme, type }) =>
    type && ['defaultMenu', 'inlineCommentSubMenu'].includes(type) && theme.breakpoints.down('sm')} {
    ${({ inline, theme }) => !inline && `width: calc(100vw - ${theme.spacing(1)})`};
    margin: ${({ theme }) => theme.spacing(2, 0.5)};
    ${({ noScroll }) => (noScroll ? '' : 'overflow-x: auto')};
  }
`;

export function Menu({
  children,
  type,
  noScroll,
  inline,
  'data-test': dataTest
}: {
  children: React.ReactNode;
  type?: SubMenu;
  noScroll?: boolean;
  inline?: boolean;
  'data-test'?: string;
}) {
  return (
    <StyledMenu elevation={8} type={type} noScroll={noScroll} inline={inline} data-test={dataTest}>
      {children}
    </StyledMenu>
  );
}
