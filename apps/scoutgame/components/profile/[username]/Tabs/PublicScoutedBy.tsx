import 'server-only';

import { Grid2 as Grid, Typography } from '@mui/material';

import { ScoutedByCard } from 'components/common/Card/ScoutedByCard';

export async function PublicScoutedBy() {
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
