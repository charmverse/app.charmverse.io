import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box, Container, Stack } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

import { SidebarInfo } from 'components/info/SidebarInfo';

import { ScrollButton } from './components/ScrollButton';

// For Info pages
export function DocumentPageContainer({
  children,
  'data-test': dataTest
}: PropsWithChildren<{ 'data-test'?: string }>) {
  return (
    <Container data-test={dataTest} maxWidth='lg'>
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
