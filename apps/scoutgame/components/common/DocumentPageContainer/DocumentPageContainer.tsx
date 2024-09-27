import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Container, Stack } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

import { ScrollButton } from './components/ScrollButton';

// For Info pages
export function DocumentPageContainer({
  children,
  'data-test': dataTest
}: PropsWithChildren<{ 'data-test'?: string }>) {
  return (
    <Container data-test={dataTest} maxWidth='md'>
      <Stack py={8} gap={8} mx='auto' width='854px' maxWidth='100%'>
        {children}
        <ScrollButton scrollType='up' sx={{ textAlign: 'center', width: '100%' }}>
          back to top <ArrowDropUpIcon fontSize='small' />
        </ScrollButton>
      </Stack>
    </Container>
  );
}
