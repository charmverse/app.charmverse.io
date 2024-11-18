import { Box, Stack } from '@mui/material';

import { Header } from 'components/common/Header';
import { GeneralBackgroundImage } from 'components/layout/GeneralBackgroundImage';
import { StickyFooter } from 'components/layout/StickyFooter';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Stack height='100vh'>
      <Header />
      <Box sx={{ minHeight: 'calc(100vh - 107px)', overflow: 'auto', px: 1 }} component='main'>
        <GeneralBackgroundImage />
        {children}
      </Box>
      <Box sx={{ position: 'relative', zIndex: 1, height: 'calc(100vh - 107.5px)', overflow: 'auto' }}>{children}</Box>
      <StickyFooter />
    </Stack>
  );
}
