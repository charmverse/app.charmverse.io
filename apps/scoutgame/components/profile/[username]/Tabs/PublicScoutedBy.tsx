import 'server-only';

import { Grid2 as Grid, Typography } from '@mui/material';
import { delay } from '@root/lib/utils/async';

import { ScoutedByCard } from 'components/common/Card/ScoutedByCard';

export async function PublicScoutedBy() {
  await delay(3000);

  return (
    <>
      <Typography variant='subtitle1' color='secondary' fontWeight='500' my={1}>
        Scouted By
      </Typography>
      <Grid container spacing={1}>
        {new Array(3).fill('').map(() => (
          <Grid key={Math.random() * 1000} size={4}>
            <ScoutedByCard />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
