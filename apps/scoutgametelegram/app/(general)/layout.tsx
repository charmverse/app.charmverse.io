import { Box } from '@mui/material';

import { Header } from 'components/common/Header';
import { GeneralBackgroundImage } from 'components/layout/GeneralBackgroundImage';
import { StickyFooter } from 'components/layout/StickyFooter';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <Box sx={{ minHeight: 'calc(100vh - 107px)', overflow: 'auto' }} component='main'>
        <GeneralBackgroundImage />
        {children}
      </Box>
      <StickyFooter />
    </>
  );
}
