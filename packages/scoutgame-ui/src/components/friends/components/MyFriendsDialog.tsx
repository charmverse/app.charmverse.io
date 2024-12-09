'use client';

import { Box, Button } from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Dialog } from '../../../components/common/Dialog';

export function MyFriendsDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Button variant='text' onClick={() => setOpen(true)}>
        My Friends
      </Button>
      <Dialog title='My Friends' open={open} onClose={() => setOpen(false)}>
        {children}
      </Dialog>
    </Box>
  );
}
