import 'server-only';

import { Box, Grid2 as Grid } from '@mui/material';
import { delay } from '@root/lib/utils/async';

import { UserCardGrid } from 'components/common/Card/UserCardGrid';
import { userCards } from 'lib/users/mock/userCards';

export async function ScoutedBuilders() {
  await delay(3000);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <UserCardGrid users={userCards} />
    </Box>
  );
}
