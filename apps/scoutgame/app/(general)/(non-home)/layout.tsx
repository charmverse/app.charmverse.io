import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export default async function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Box
      component='main'
      minHeight='100%'
      px={{
        xs: 1,
        md: 10
      }}
    >
      {children}
    </Box>
  );
}
