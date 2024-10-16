'use client';

import MenuIcon from '@mui/icons-material/Menu';
import { Drawer, IconButton } from '@mui/material';
import { useState } from 'react';

import { useMdScreen } from 'hooks/useMediaScreens';

import { SidebarInfo } from './SidebarInfo';

export function SidebarInfoDrawer() {
  const isMdScreen = useMdScreen();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (typeof isMdScreen === 'undefined' || isMdScreen) {
    return null;
  }

  return (
    <>
      <IconButton onClick={handleOpen}>
        <MenuIcon />
      </IconButton>
      <Drawer
        open={open}
        onClose={handleClose}
        variant='temporary'
        ModalProps={{
          keepMounted: true
        }}
      >
        <SidebarInfo />
      </Drawer>
    </>
  );
}
