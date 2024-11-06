import { Card, CardContent, Grid2 as Grid, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import type { DailyClaim } from 'lib/users/getDailyClaims';

function DailyClaimCard({ dailyClaim }: { dailyClaim: DailyClaim }) {
  return (
    <Stack
      sx={{
        backgroundColor: 'background.paper',
        width: '100%',
        height: 100,
        borderRadius: 1,
        alignItems: 'center',
        position: 'relative'
      }}
    >
      <Stack direction='row' justifyContent='center' alignItems='center' gap={0.5} flex={1}>
        <Typography variant='h5' fontWeight={600}>
          +1
        </Typography>
        <Image src='/images/profile/scout-game-profile-icon.png' alt='Scout game icon' width={25} height={15} />
      </Stack>
      <Typography variant='body2' position='absolute' bottom={10}>
        Day {dailyClaim.day}
      </Typography>
    </Stack>
  );
}

export function DailyClaimGallery({ dailyClaims }: { dailyClaims: DailyClaim[] }) {
  return (
    <Stack justifyContent='center' alignItems='center' gap={2}>
      <Typography variant='h4' color='secondary' fontWeight={600}>
        Daily Claim
      </Typography>
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
