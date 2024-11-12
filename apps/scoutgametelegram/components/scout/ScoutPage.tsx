import { Stack, Typography } from '@mui/material';
import { LoadingCards } from '@packages/scoutgame/components/common/Loading/LoadingCards';
import { TodaysHotBuildersCarousel } from '@packages/scoutgame/components/home/TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';
import { Suspense } from 'react';

export default function ScoutPage() {
  return (
    <Stack>
      <Typography zIndex={1000} my={2} variant='h4' textAlign='center' color='secondary' fontWeight='bold'>
        Scout Today's HOT Builders!
      </Typography>
      <Suspense key='todays-hot-builders' fallback={<LoadingCards />}>
        <TodaysHotBuildersCarousel />
      </Suspense>
    </Stack>
  );
}
