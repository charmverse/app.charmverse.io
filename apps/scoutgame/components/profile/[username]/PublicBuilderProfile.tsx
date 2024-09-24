import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { currentSeason } from '@packages/scoutgame/utils';
import { notFound } from 'next/navigation';

import { BuilderActivitiesList } from 'components/builder/BuilderActivitiesList';
import { BuilderCard } from 'components/builder/Card/BuilderCard';
import { BuilderCardNftDisplay } from 'components/builder/Card/BuilderCardNftDisplay';
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
  const builderActivities = await getBuilderActivities(builderId);
  const { scouts, totalNftsSold } = await getBuilderScouts(builderId);
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
      <Paper sx={{ py: { xs: 1, md: 2 }, pr: { xs: 1, md: 2 } }}>
        <Stack flexDirection='row'>
          <BackButton />
          <Stack flexDirection='row' alignItems='center' gap={4}>
            <Box width={{ xs: 100, md: 150 }}>
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
            <Stack>
              <UserProfile
                user={{
                  username: builder.username,
                  displayName: builder.displayName,
                  id: builderId,
                  githubLogin: builder.githubUser[0]?.login,
                  bio: builder.bio
                }}
              />
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
