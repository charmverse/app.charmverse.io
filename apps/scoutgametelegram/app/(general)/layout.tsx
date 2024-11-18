import { Box, Stack } from '@mui/material';

import { Header } from 'components/common/Header';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import { StickyFooter } from 'components/layout/StickyFooter';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Stack height='100vh'>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1 }}>
        <Header />
      </Box>
      <InfoBackgroundImage />
      <Box sx={{ position: 'relative', zIndex: 1, height: 'calc(100vh - 107.5px)', overflow: 'auto' }}>{children}</Box>
      <StickyFooter />
    </Stack>
  );
}
