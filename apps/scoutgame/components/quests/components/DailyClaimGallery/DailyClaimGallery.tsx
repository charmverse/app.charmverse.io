import { Grid2 as Grid, Stack, Typography } from '@mui/material';

import type { DailyClaim } from 'lib/users/getDailyClaims';

import { DailyClaimCard } from './DailyClaimCard';
import { NextClaimCountdown } from './NextClaimCountdown';

export function DailyClaimGallery({ dailyClaims }: { dailyClaims: DailyClaim[] }) {
  return (
    <Stack justifyContent='center' alignItems='center' gap={1} my={2}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Daily Claim
      </Typography>
      <NextClaimCountdown />
      <Grid container spacing={1} width='100%'>
        {dailyClaims.map((dailyClaim) => (
          <Grid size={4} key={dailyClaim.date.toString()}>
            <DailyClaimCard dailyClaim={dailyClaim} />
          </Grid>
        ))}
        <Grid size={8}>
          <DailyClaimCard dailyClaim={dailyClaims[0]} />
        </Grid>
      </Grid>
    </Stack>
  );
}
