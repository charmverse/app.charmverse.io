import { Grid2 as Grid, Stack, Typography } from '@mui/material';
import dynamic from 'next/dynamic';

import type { DailyClaim } from 'lib/claims/getDailyClaims';

import { DailyClaimCard } from './DailyClaimCard';

// A time based component needs to be rendered only on the client since the server and client will not match
const NextClaimCountdown = dynamic(() => import('./NextClaimCountdown').then((mod) => mod.NextClaimCountdown), {
  ssr: false
});

export function DailyClaimGallery({ dailyClaims }: { dailyClaims: DailyClaim[] }) {
  return (
    <Stack justifyContent='center' alignItems='center' gap={1} my={2}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Daily Claim
      </Typography>
      <NextClaimCountdown />
      <Grid container spacing={1} width='100%'>
        {dailyClaims.map((dailyClaim) => (
          <Grid size={dailyClaim.isBonus ? 8 : 4} key={`${dailyClaim.day}-${dailyClaim.isBonus}`}>
            <DailyClaimCard
              dailyClaim={dailyClaim}
              hasClaimedStreak={dailyClaims.filter((claim) => claim.claimed).length === 7}
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
