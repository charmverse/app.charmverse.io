import * as React from 'react';
import { useState } from 'react';

import { useLocalStorage } from 'hooks/useLocalStorage';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useResize } from 'hooks/useResize';

export const MAX_SIDEBAR_WIDTH = 500;
const MIN_SIDEBAR_WIDTH = 200;

export function useNavigationSidebar({ enabled }: { enabled: boolean }) {
  const isMobile = useSmallScreen();
  const [storageOpen, setStorageOpen] = useLocalStorage('leftSidebar', !isMobile);
  const [sidebarStorageWidth, setSidebarStorageWidth] = useLocalStorage('leftSidebarWidth', 300);
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    width: resizableSidebarWidth,
    enableResize,
    isResizing
  } = useResize({
    initialWidth: sidebarStorageWidth,
    minWidth: MIN_SIDEBAR_WIDTH,
    maxWidth: MAX_SIDEBAR_WIDTH,
    onResize: setSidebarStorageWidth
  });
  const open = isMobile ? mobileOpen : storageOpen;

  let sidebarWidth = resizableSidebarWidth;
  if (isMobile || !enabled) {
    sidebarWidth = 0;
  }
  const handleDrawerOpen = React.useCallback(() => {
    if (isMobile) {
      setMobileOpen(true);
    } else {
      setStorageOpen(true);
    }
  }, [isMobile, setMobileOpen, setStorageOpen]);

  const handleDrawerClose = React.useCallback(() => {
    if (isMobile) {
      setMobileOpen(false);
    } else {
      setStorageOpen(false);
    }
  }, [isMobile, setMobileOpen, setStorageOpen]);

  return {
    open,
    sidebarWidth,
    enableResize,
    isResizing,
    handleDrawerOpen,
    handleDrawerClose
  };
}
