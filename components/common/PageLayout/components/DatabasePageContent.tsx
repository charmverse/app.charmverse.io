import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export function DatabaseContainer({ children }: { children: ReactNode }) {
  return (
    <div className='focalboard-body full-page'>
      <Box className='BoardComponent drag-area-container'>{children}</Box>
    </div>
  );
}

export function DatabaseStickyHeader({ children }: { children: ReactNode }) {
  return <div className='top-head'>{children}</div>;
}

export function DatabaseTitle({ children }: { children: ReactNode }) {
  return (
    <Box pt={10} className='ViewTitle'>
      <Box mb={2} data-test='board-title'>
        {children}
      </Box>
    </Box>
  );
}
