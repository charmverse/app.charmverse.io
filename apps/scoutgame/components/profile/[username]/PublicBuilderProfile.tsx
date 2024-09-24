import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { currentSeason } from '@packages/scoutgame/utils';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { BuilderActivitiesList } from 'components/builder/BuilderActivitiesList';
import { BuilderCard } from 'components/builder/Card/BuilderCard';
import { BackButton } from 'components/common/Button/BackButton';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { BuilderWeeklyStats } from 'components/profile/mine/BuilderProfile/BuilderWeeklyStats';
import { ScoutsGallery } from 'components/scout/ScoutsGallery';
import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getBuilderScouts } from 'lib/builders/getBuilderScouts';
import { getBuilderStats } from 'lib/builders/getBuilderStats';
import { getBuilderWeeklyStats } from 'lib/builders/getBuilderWeeklyStats';

export async function PublicBuilderProfile({ builderId }: { builderId: string }) {
  const builderWeeklyStats = await getBuilderWeeklyStats(builderId);
  const { allTimePoints, seasonPoints } = await getBuilderStats(builderId);
  const builderActivities = await getBuilderActivities({ builderId, take: 5 });
  const { scouts, totalNftsSold, totalScouts } = await getBuilderScouts(builderId);
  const builder = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      avatar: true,
      username: true,
      displayName: true,
      bio: true,
      githubUser: {
        select: {
          login: true
        }
      },
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          currentPrice: true
        }
      }
    }
  });

  if (!builder) {
    notFound();
  }

  return (
    <Stack gap={2}>
      <Paper sx={{ py: 2, pr: { xs: 1, md: 2 } }}>
        <Stack flexDirection='row'>
          <BackButton />
          <Stack flexDirection='row' alignItems='center' gap={2}>
            <Box width={{ xs: 145, md: 150 }}>
              <BuilderCard
                builder={{
                  id: builderId,
                  nftAvatar: builder.avatar || '',
                  username: builder.username,
                  displayName: builder.displayName,
                  price: Number(builder.builderNfts[0]?.currentPrice ?? 0)
                }}
                hideDetails
                showPurchaseButton
              />
            </Box>
            <Stack width='calc(100% - 150px)' gap={1}>
              <UserProfile
                user={{
                  username: builder.username,
                  displayName: builder.displayName,
                  id: builderId,
                  githubLogin: builder.githubUser[0]?.login,
                  bio: builder.bio
                }}
              />
              <Stack gap={0.5}>
                <Typography fontWeight={500} color='secondary' variant='subtitle1'>
                  THIS SEASON (ALL TIME)
                </Typography>
                <Stack flexDirection='row' gap={1} alignItems='center'>
                  <Typography fontWeight={500} variant='h5' color='green.main'>
                    {seasonPoints}
                  </Typography>
                  <Image src='/images/profile/scout-game-green-icon.svg' width='25' height='25' alt='scout game icon' />
                  <Typography fontWeight={500} variant='h6' color='green.main'>
                    ({allTimePoints})
                  </Typography>
                </Stack>
                <Typography fontWeight={500} variant='h5' color='green.main'>
                  {totalScouts} Scouts
                </Typography>
                <Stack flexDirection='row' gap={1} alignItems='center'>
                  <Typography fontWeight={500} variant='h5' color='green.main'>
                    {totalNftsSold}
                  </Typography>
                  <Image src='/images/profile/icons/nft-green-icon.svg' width='25' height='25' alt='nft icon' />
                  <Typography fontWeight={500} variant='h5' color='green.main'>
                    Sold
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
      <Stack>
        <Typography color='secondary'>This Week</Typography>
        <BuilderWeeklyStats gemsCollected={builderWeeklyStats.gemsCollected} rank={builderWeeklyStats.rank} />
      </Stack>
      <Stack>
        <Typography color='secondary'>Recent Activity</Typography>
        <BuilderActivitiesList activities={builderActivities} />
      </Stack>
      <Stack gap={0.5}>
        <Typography color='secondary'>Scouted By</Typography>
        <ScoutsGallery scouts={scouts} />
      </Stack>
    </Stack>
  );
}
