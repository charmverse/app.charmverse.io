import { Skeleton } from '@mui/material';
import { Stack } from '@mui/system';

import { LoadingBanner } from 'components/layout/Loading/LoadingBanner';
import { LoadingCards } from 'components/layout/Loading/LoadingCards';
import { LoadingTable } from 'components/layout/Loading/LoadingTable';

export default function Loading() {
  return (
    <Stack gap={2}>
      <LoadingBanner />
      <Stack flexDirection='row' justifyContent='center' alignItems='center'>
        <Skeleton animation='wave' variant='rectangular' height={40} width='50%' />
      </Stack>
      <LoadingCards />
      <Stack flexDirection='row' justifyContent='center' alignItems='center'>
        <Skeleton animation='wave' variant='rectangular' height={40} width='50%' />
      </Stack>
      <LoadingTable />
    </Stack>
  );
}
