import { Box, Stack } from '@mui/material';
import { Header } from '@packages/scoutgame-ui/components/common/Navigation/Header';
import { StickyFooter } from '@packages/scoutgame-ui/components/common/Navigation/StickyFooter';

import { GeneralBackgroundImage } from 'components/layout/GeneralBackgroundImage';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Stack height='100vh'>
      <Header />
      <Box
        sx={{
          minHeight: 'calc(100vh - 117.5px)',
          overflow: 'auto',
          px: 1
        }}
        component='main'
      >
        {children}
      </Box>
      <StickyFooter />
    </Stack>
  );
}
