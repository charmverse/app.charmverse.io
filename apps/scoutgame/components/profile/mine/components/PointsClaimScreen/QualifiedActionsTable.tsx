import { Divider, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import type { WeeklyReward } from 'lib/points/getClaimablePoints';

export function QualifiedActionsTable({ weeklyRewards }: { weeklyRewards: WeeklyReward[] }) {
  return (
    <Stack>
      {weeklyRewards.map((weeklyReward) => (
        <>
          <Stack key={weeklyReward.week} gap={1.5}>
            <Typography variant='h6' fontWeight={600}>
              Week {weeklyReward.weekNumber}
            </Typography>
            <Stack gap={1.5}>
              {weeklyReward.githubContributionReward ? (
                <Stack flexDirection='row' gap={1} justifyContent='space-between'>
                  <Stack gap={0.5}>
                    <Typography>Finished within {weeklyReward.rank} rank</Typography>
                    {weeklyReward.githubContributionReward.streakCount ? (
                      <Typography variant='body2'>
                        {weeklyReward.githubContributionReward.streakCount}x contribution streak
                      </Typography>
                    ) : null}
                    {weeklyReward.githubContributionReward.firstContributionsCount ? (
                      <Typography variant='body2'>
                        {weeklyReward.githubContributionReward.firstContributionsCount} x first contribution
                      </Typography>
                    ) : null}
                    {weeklyReward.githubContributionReward.regularContributionsCount ? (
                      <Typography variant='body2'>
                        {weeklyReward.githubContributionReward.regularContributionsCount} x regular contribution
                      </Typography>
                    ) : null}
                  </Stack>
                  <Stack flexDirection='row' gap={1} alignItems='center'>
                    <Typography>{weeklyReward.githubContributionReward.points}</Typography>
                    <Image width={20} height={20} src='/images/profile/scout-game-icon.svg' alt='Nfts' />
                  </Stack>
                </Stack>
              ) : null}
              {weeklyReward.builderReward ? (
                <Stack flexDirection='row' justifyContent='space-between'>
                  <Typography>Builder Rewards</Typography>
                  <Stack flexDirection='row' gap={1} alignItems='center'>
                    <Typography>{weeklyReward.builderReward.points}</Typography>
                    <Image width={20} height={20} src='/images/profile/scout-game-icon.svg' alt='Nfts' />
                  </Stack>
                </Stack>
              ) : null}
              {weeklyReward.soldNftReward ? (
                <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
                  <Stack flexDirection='row' gap={1} alignItems='center'>
                    <Typography>Sold {weeklyReward.soldNftReward.quantity} NFTs</Typography>
                    <Image width={20} height={20} src='/images/profile/icons/nft-orange-icon.svg' alt='Nfts' />
                  </Stack>
                  <Stack flexDirection='row' gap={1} alignItems='center'>
                    <Typography>{weeklyReward.soldNftReward.points}</Typography>
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
