import { ReactNode } from 'react';
import { Box } from '@mui/material';
import ScrollableWindow from './ScrollableWindow';

export function CenteredPageContent (props: { children: ReactNode }) {
  return (
    <ScrollableWindow>
      <Box py={3} sx={{ width: 1200, maxWidth: '100%', px: { xs: '20px', sm: '80px' } }} mx='auto' mb={10}>
        {props.children}
      </Box>
    </ScrollableWindow>
  );
}

export function FullWidthPageContent (props: { children: ReactNode }) {

  return (
    <ScrollableWindow>
      <Box py={3} sx={{ px: { xs: '20px', sm: '80px' }, minHeight: '80vh' }}>
        {props.children}
      </Box>
    </ScrollableWindow>
  );
}
