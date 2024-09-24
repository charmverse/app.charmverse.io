import { Button, Paper, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import Image from 'next/image';

import { getUserClaimablePoints } from 'lib/users/getUserClaimablePoints';

export async function PointsClaimScreen({ userId, username }: { userId: string; username: string }) {
  const { totalClaimablePoints } = await getUserClaimablePoints(userId);

  if (!totalClaimablePoints) {
    return (
      <Typography textAlign='center' variant='h5'>
        No points to claim
      </Typography>
    );
  }

  return (
    <Stack alignItems='center' justifyContent='center' height='100%'>
      <Typography variant='h5' textAlign='center'>
        Congratulations!
        <br /> You have earned {totalClaimablePoints} Scout Points!
      </Typography>
      <Paper
        sx={{
          padding: 2,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Stack gap={1}>
          <Typography variant='h6'>
            <b>{username}</b> will receive
          </Typography>
          <Stack flexDirection='row'>
            <Typography variant='h5'>{totalClaimablePoints}</Typography>
            <Image width={15} height={15} src='/images/profile/icons/scout-icon.svg' alt='Scouts' />
          </Stack>
        </Stack>
        <Button variant='contained' color='primary'>
          Claim now
        </Button>
      </Paper>
    </Stack>
  );
}
