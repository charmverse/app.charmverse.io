import { useEditorViewContext } from '@bangle.dev/react';
import { selectionTooltip } from '@bangle.dev/tooltip';
import styled from '@emotion/styled';
import { ClickAwayListener } from '@mui/material';
import Paper from '@mui/material/Paper';
import type { PluginKey } from 'prosemirror-state';
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

export function Menu({ children, menuKey, type }: { children: React.ReactNode; menuKey: PluginKey; type?: SubMenu }) {
  const view = useEditorViewContext();

  function hideMenu() {
    selectionTooltip.hideSelectionTooltip(menuKey)(view.state, view.dispatch, view);
  }
  return (
    <ClickAwayListener onClickAway={hideMenu}>
      <StyledMenu elevation={8} type={type}>
        {children}
      </StyledMenu>
    </ClickAwayListener>
  );
}
