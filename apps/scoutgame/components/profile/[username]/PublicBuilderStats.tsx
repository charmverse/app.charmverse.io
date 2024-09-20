import 'server-only';

import { Paper, Stack, Typography } from '@mui/material';
import { delay } from '@root/lib/utils/async';
import Image from 'next/image';

export async function PublicBuilderStats() {
  await delay(3000);

  return (
    <>
      <Typography variant='subtitle1' my={1} color='secondary' fontWeight='500'>
        This week
      </Typography>
      <Paper sx={{ p: 1 }}>
        <Stack flexDirection='row' justifyContent='space-between'>
          <Typography variant='subtitle1' fontWeight='500'>
            SEASON 1<br /> WEEK 1
          </Typography>
          <Stack>
            <Typography color='secondary'>COLLECTED</Typography>
            <Stack flexDirection='row' justifyContent='center' alignItems='center' gap={1}>
              <Typography variant='h4' component='p' textAlign='center'>
                13
              </Typography>
              <Image src='/images/profile/icons/hex-gem-icon.svg' width='25' height='25' alt='gems icon' />
            </Stack>
          </Stack>
          <Stack>
            <Typography color='secondary'>RANK</Typography>
            <Typography variant='h4' component='p' textAlign='center'>
              5
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
