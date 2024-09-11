import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import { getUserFromSession } from 'lib/session/getUserFromSession';
import 'theme/styles.scss';

export default async function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getUserFromSession();

  return (
    <Box component='main' bgcolor='background.default' p={3} minHeight='100vh'>
      {children}
    </Box>
  );
}
