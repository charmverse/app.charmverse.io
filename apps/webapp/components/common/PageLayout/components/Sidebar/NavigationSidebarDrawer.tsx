import { styled } from '@mui/material';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import type { Theme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { useMemo } from 'react';

import { useSmallScreen } from 'hooks/useMediaScreens';
import { useWindowSize } from 'hooks/useWindowSize';

import { MAX_SIDEBAR_WIDTH } from './hooks/useNavigationSidebar';
import { NavigationSidebar } from './NavigationSidebar';

const openedMixin = (theme: Theme, sidebarWidth: number) => ({
  maxWidth: '100%',
  width: sidebarWidth,
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden' as const,
  border: 'none'
});

const closedMixin = (theme: Theme) =>
  ({
    transition: theme.transitions.create(['width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    overflowX: 'hidden' as const,
    width: 0,
    border: 'none'
  }) as const;

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'sidebarWidth'
})<{ sidebarWidth: number }>(({ sidebarWidth, theme, open }) => ({
  width: sidebarWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme, sidebarWidth),
    '& .MuiDrawer-paper': openedMixin(theme, sidebarWidth)
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme)
  }),
  paddingRight: 3
}));
const DraggableHandle = styled('div')<{ isActive?: boolean; disabled?: boolean }>`
  position: absolute;
  width: 5px;
  bottom: 0;
  top: 0;
  right: 0;
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  transition: all 0.2s ease-in-out;
  background: transparent;
  ${({ disabled, theme }) =>
    !disabled &&
    `&:hover {
        border-right: 3px solid ${theme.palette.primary.main}
        }
      cursor: col-resize;
    `}
  ${({ isActive, theme }) => (isActive ? `border-right: 3px solid ${theme.palette.primary.main}` : '')}
`;

export function NavigationSidebarDrawer({
  enabled,
  enableResizing,
  enableSpaceFeatures,
  enableResize,
  isResizing,
  width: sidebarWidth,
  open,
  closeSidebar
}: {
  enabled: boolean;
  enableResizing: boolean;
  enableSpaceFeatures: boolean;
  enableResize: (e: any) => void;
  isResizing: boolean;
  width: number;
  open: boolean;
  closeSidebar: VoidFunction;
}) {
  const { width } = useWindowSize();
  const isMobile = useSmallScreen();

  const mobileSidebarWidth = width ? Math.min(width * 0.85, MAX_SIDEBAR_WIDTH) : 0;

  const drawerContent = useMemo(
    () =>
      !enabled ? (
        <div></div>
      ) : (
        <NavigationSidebar
          enableSpaceFeatures={enableSpaceFeatures}
          closeSidebar={closeSidebar}
          navAction={isMobile ? closeSidebar : undefined}
        />
      ),
    [closeSidebar, enabled, isMobile]
  );

  return isMobile ? (
    <MuiDrawer
      open={open}
      variant='temporary'
      onClose={closeSidebar}
      ModalProps={{
        keepMounted: true
      }}
    >
      <Box width={mobileSidebarWidth} minHeight='100vh'>
        {drawerContent}
      </Box>
    </MuiDrawer>
  ) : (
    <Drawer sidebarWidth={sidebarWidth} open={open} variant='permanent' sx={{ overflowX: 'auto' }}>
      {drawerContent}
      <Tooltip title={!enableResizing || isResizing ? '' : 'Drag to resize'} placement='right' followCursor>
        <DraggableHandle onMouseDown={(e) => enableResize(e)} isActive={isResizing} disabled={!enableResizing} />
      </Tooltip>
    </Drawer>
  );
}
