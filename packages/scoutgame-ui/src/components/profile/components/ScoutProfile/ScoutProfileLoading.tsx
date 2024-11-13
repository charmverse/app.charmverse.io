import { Stack } from '@mui/material';

import { LoadingCard } from '../../../common/Loading/LoadingCard';
import { LoadingCards } from '../../../common/Loading/LoadingCards';

export function ScoutProfileLoading() {
  return (
    <Stack>
      <LoadingCard />
      <LoadingCards />
    </Stack>
  );
}
