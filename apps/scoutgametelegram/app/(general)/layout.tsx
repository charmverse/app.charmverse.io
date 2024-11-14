import { Box } from '@mui/material';

import { Header } from 'components/common/Header';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import { StickyFooter } from 'components/layout/StickyFooter';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Box sx={{ minHeight: 'calc(100vh + 120px)', position: 'relative', overflow: 'auto' }}>
        <Header />
        <InfoBackgroundImage />
        <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
      </Box>
      <StickyFooter />
    </>
  );
}
