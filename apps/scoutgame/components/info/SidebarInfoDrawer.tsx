'use client';

import MenuIcon from '@mui/icons-material/Menu';
import { Drawer, IconButton } from '@mui/material';
import { useState } from 'react';

import { SidebarInfo } from './SidebarInfo';

export function SidebarInfoDrawer() {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
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
        <SidebarInfo handleClose={handleClose} />
      </Drawer>
    </>
  );
}
