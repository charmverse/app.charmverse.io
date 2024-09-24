import { Button, Divider, Paper, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import Image from 'next/image';

import { getUserClaimablePoints } from 'lib/users/getUserClaimablePoints';

export async function PointsClaimScreen({ userId, username }: { userId: string; username: string }) {
  const { totalClaimablePoints, weeklyRewards } = await getUserClaimablePoints(userId);

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
        <Button variant='contained' color='primary'>
          Claim now
        </Button>
      </Paper>
      <Typography variant='h5' textAlign='left' fontWeight={500} my={2}>
        QUALIFIED ACTIONS
      </Typography>
      <Stack>
        {weeklyRewards.map((reward) => (
          <>
            <Stack key={reward.week} gap={1.5}>
              <Typography variant='h6' fontWeight={600}>
                {reward.week}
              </Typography>
              <Stack gap={1.5}>
                {reward.githubContributionReward ? (
                  <Stack flexDirection='row' gap={1} justifyContent='space-between'>
                    <Stack gap={0.5}>
                      <Typography>Finished within 100 rank</Typography>
                      {reward.githubContributionReward.streakCount ? (
                        <Typography variant='body2'>
                          {reward.githubContributionReward.streakCount}x contribution streak
                        </Typography>
                      ) : null}
                      {reward.githubContributionReward.firstContributionsCount ? (
                        <Typography variant='body2'>
                          {reward.githubContributionReward.firstContributionsCount} x first contribution
                        </Typography>
                      ) : null}
                      {reward.githubContributionReward.regularContributionsCount ? (
                        <Typography variant='body2'>
                          {reward.githubContributionReward.regularContributionsCount} x regular contribution
                        </Typography>
                      ) : null}
                    </Stack>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                      <Typography>{reward.githubContributionReward.points}</Typography>
                      <Image width={20} height={20} src='/images/profile/scout-game-icon.svg' alt='Nfts' />
                    </Stack>
                  </Stack>
                ) : null}
                {reward.builderReward ? (
                  <Stack flexDirection='row' justifyContent='space-between'>
                    <Typography>Builder Rewards</Typography>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                      <Typography>{reward.builderReward.points}</Typography>
                      <Image width={20} height={20} src='/images/profile/scout-game-icon.svg' alt='Nfts' />
                    </Stack>
                  </Stack>
                ) : null}
                {reward.soldNftReward ? (
                  <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                      <Typography>Sold {reward.soldNftReward.quantity} NFTs</Typography>
                      <Image width={20} height={20} src='/images/profile/icons/nft-orange-icon.svg' alt='Nfts' />
                    </Stack>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                      <Typography>{reward.soldNftReward.points}</Typography>
                      <Image width={20} height={20} src='/images/profile/scout-game-icon.svg' alt='Nfts' />
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
          </>
        ))}
      </Stack>
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
