import { Divider, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import type { WeeklyReward } from 'lib/points/getClaimablePoints';

export function QualifiedActionsTable({ weeklyRewards }: { weeklyRewards: WeeklyReward[] }) {
  return (
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
  );
}
