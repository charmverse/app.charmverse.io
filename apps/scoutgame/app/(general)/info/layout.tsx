import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Container, Stack } from '@mui/material';
import type { ReactNode } from 'react';

import { ScrollButton } from 'components/common/DocumentPageContainer/components/ScrollButton';
import { SidebarInfo } from 'components/info/SidebarInfo';

export default function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Container maxWidth='lg'>
      <Stack py={8} gap={8} maxWidth='100%' flexDirection='row'>
        <Stack sx={{ display: { xs: 'none', md: 'flex' } }}>
          <SidebarInfo />
        </Stack>
        <Stack maxWidth='854px' width='100%' mx='auto' gap={8}>
          {children}
          <ScrollButton scrollType='up' sx={{ textAlign: 'center', width: '100%' }}>
            back to top <ArrowDropUpIcon fontSize='small' />
          </ScrollButton>
        </Stack>
      </Stack>
    </Container>
  );
}
