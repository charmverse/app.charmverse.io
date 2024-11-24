import { Container, Paper, Stack } from '@mui/material';
import { SidebarInfo } from '@packages/scoutgame-ui/components/info/components/SidebarInfo';
import type { ReactNode } from 'react';

export default async function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Stack
      py={8}
      gap={8}
      maxWidth='100%'
      flexDirection='row'
      component={Paper}
      sx={{ p: 1, backgroundColor: 'background.dark' }}
    >
      <Stack sx={{ display: { xs: 'none', md: 'flex' } }}>
        <SidebarInfo />
      </Stack>
      {children}
    </Stack>
  );
}
