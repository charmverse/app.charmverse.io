import 'server-only';

import { Paper, Stack, Typography } from '@mui/material';
import { delay } from '@root/lib/utils/async';
import Image from 'next/image';

export async function PublicScoutStats() {
  await delay(3000);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography paddingY={1} variant='subtitle1' textAlign='center' color='secondary'>
        THIS SEASON (ALL TIME)
      </Typography>
      <Stack flexDirection='row' justifyContent='space-between'>
        <Stack flexDirection='row' gap={1}>
          <Typography color='orange.main'>500</Typography>
          <Image src='/images/profile/scout-game-orange-icon.svg' width='25' height='25' alt='scout game icon' />
          <Typography color='orange.main'>(5,000)</Typography>
        </Stack>
        <Typography color='orange.main'>5 Builders</Typography>
        <Stack flexDirection='row' gap={1}>
          <Typography color='orange.main'>20</Typography>
          <Image src='/images/profile/icons/nft-orange-icon.svg' width='25' height='25' alt='nft icon' />
          <Typography color='orange.main'>Held</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
