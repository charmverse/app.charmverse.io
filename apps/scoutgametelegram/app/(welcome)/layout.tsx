import { Box } from '@mui/material';

import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Box component='main' bgcolor='background.default' p={{ md: 3 }} height='100%' minHeight='100dvh'>
      <InfoBackgroundImage />
      <Box maxWidth='700px' margin='auto' height='100%'>
        {children}
      </Box>
    </Box>
  );
}
