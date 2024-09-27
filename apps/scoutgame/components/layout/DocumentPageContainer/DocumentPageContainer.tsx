import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Container, Box, Card, CardContent, List, ListItem, Stack, Typography, Divider, styled } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';
import Image from 'next/image';

import { ScrollButton } from './components/ScrollButton';

// For Info pages
export function DocumentPageContainer({ children }: PropsWithChildren) {
  return (
    <Container data-test='info-page' maxWidth='md'>
      <Stack py={8} gap={8} mx='auto' width='854px' maxWidth='100%'>
        {children}
        <ScrollButton scrollType='up' sx={{ textAlign: 'center', width: '100%' }}>
          back to top <ArrowDropUpIcon fontSize='small' />
        </ScrollButton>
      </Stack>
    </Container>
  );
}
