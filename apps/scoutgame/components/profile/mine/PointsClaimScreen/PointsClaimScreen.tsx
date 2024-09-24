import { Paper, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import Image from 'next/image';

import { getClaimablePoints } from 'lib/points/getClaimablePoints';

import { PointsClaimButton } from './PointsClaimButton';
import { QualifiedActionsTable } from './QualifiedActionsTable';

export async function PointsClaimScreen({ userId, username }: { userId: string; username: string }) {
  const { totalClaimablePoints, weeklyRewards } = await getClaimablePoints(userId);

  if (!totalClaimablePoints) {
    return (
      <Typography textAlign='center' variant='h5'>
        No points to claim
      </Typography>
    );
  }

  return (
    <Stack height='100%' p={1}>
      <Typography variant='h5' textAlign='center' fontWeight={500} my={2}>
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
          alignItems: 'center',
          width: '100%'
        }}
      >
        <Stack gap={1}>
          <Typography variant='h6'>
            <b>{username}</b> will receive
          </Typography>
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <Typography variant='h4' fontWeight={500}>
              {totalClaimablePoints}
            </Typography>
            <Image width={35} height={35} src='/images/profile/scout-game-icon.svg' alt='Scouts' />
          </Stack>
        </Stack>
        <PointsClaimButton />
      </Paper>
      <Typography variant='h5' textAlign='left' fontWeight={500} my={2}>
        QUALIFIED ACTIONS
      </Typography>
      <QualifiedActionsTable weeklyRewards={weeklyRewards} />
      <Stack flexDirection='row' justifyContent='space-between' width='100%' alignItems='center'>
        <Typography variant='h6'>Total Scout Points</Typography>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Typography>{totalClaimablePoints}</Typography>
          <Image width={20} height={20} src='/images/profile/scout-game-icon.svg' alt='Nfts' />
        </Stack>
      </Stack>
    </Stack>
  );
}
