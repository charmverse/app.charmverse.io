import { Stack } from '@mui/material';

import { LoadingCard } from 'components/common/Loading/LoadingCard';
import { LoadingCards } from 'components/common/Loading/LoadingCards';

export function ScoutProfileLoading() {
  return (
    <Stack>
      <LoadingCard />
      <LoadingCards />
    </Stack>
  );
}
