import 'server-only';

import { Box } from '@mui/material';
import { delay } from '@root/lib/utils/async';

import { UserCardGrid } from 'components/common/Card/UserCardGrid';

export async function ScoutedBuilders() {
  await delay(3000);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <UserCardGrid users={[]} />
    </Box>
  );
}
