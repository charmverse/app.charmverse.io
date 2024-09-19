import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { BackButton } from 'components/common/Button/BackButton';
import { BuilderProfile } from 'components/common/Profile/BuilderProfile';

export async function BuilderTab({ user }: { user: Scout }) {
  return (
    <Box>
      <Paper sx={{ py: 1, pr: 1 }}>
        <Stack flexDirection='row'>
          <BackButton />
          <BuilderProfile user={user} />
        </Stack>
      </Paper>
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
      <Stack justifyContent='space-between' flexDirection='row' my={1}>
        <Typography variant='subtitle1' color='secondary' fontWeight='500'>
          Recent Activity
        </Typography>
        <Button LinkComponent={Link} variant='text' href='/notifications' sx={{ fontWeight: 400 }}>
          View All
        </Button>
      </Stack>
    </Box>
  );
}
