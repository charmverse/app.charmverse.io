import 'server-only';

import { Box, Grid2 as Grid } from '@mui/material';
import { delay } from '@root/lib/utils/async';

import { UserCard } from 'components/common/Card/UserCard';
import { userCards } from 'lib/users/mock/userCards';

export async function ScoutedBuilders() {
  await delay();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 6, md: 12, lg: 12 }}>
        {userCards.map((userCard) => (
          <Grid key={userCard.username} size={{ xs: 1, sm: 2, md: 3, lg: 2 }}>
            <UserCard key={userCard.username} user={userCard} variant='small' />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
