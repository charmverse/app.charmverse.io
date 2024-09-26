import { Stack } from '@mui/material';

import { LoadingCard } from 'components/layout/Loading/LoadingCard';
import { LoadingCards } from 'components/layout/Loading/LoadingCards';

export function ScoutProfileLoading() {
  return (
    <Stack>
      <LoadingCard />
      <LoadingCards />
    </Stack>
  );
}
