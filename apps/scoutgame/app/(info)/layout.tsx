import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import 'theme/styles.scss';

export default async function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Box component='main' bgcolor='background.default' p={3} minHeight='100svh'>
      <Box maxWidth='700px' margin='auto'>
        {children}
      </Box>
    </Box>
  );
}
