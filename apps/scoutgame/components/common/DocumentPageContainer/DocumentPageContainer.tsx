import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Stack } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

import { ScrollButton } from './components/ScrollButton';

// For Info pages
export function DocumentPageContainer({
  children,
  'data-test': dataTest
}: PropsWithChildren<{ 'data-test'?: string }>) {
  return (
    <>
      <Stack gap={8}>{children}</Stack>

      <ScrollButton scrollType='up' sx={{ textAlign: 'center', width: '100%' }}>
        back to top <ArrowDropUpIcon fontSize='small' />
      </ScrollButton>
    </>
  );
}
