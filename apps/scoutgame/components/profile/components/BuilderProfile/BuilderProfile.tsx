'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { Alert, Stack, Typography } from '@mui/material';
import { currentSeason } from '@packages/scoutgame/dates';
import Link from 'next/link';
import { Suspense } from 'react';

import { ScoutsGallery } from 'components/common/Gallery/ScoutsGallery';
import { JoinGithubButton } from 'components/common/JoinGithubButton';
import { BuilderActivitiesList } from 'components/profile/components/BuilderProfile/BuilderActivitiesList';
import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getBuilderScouts } from 'lib/builders/getBuilderScouts';
import { getBuilderStats } from 'lib/builders/getBuilderStats';
import type { BasicUserInfo } from 'lib/users/interfaces';

import { BuilderStats } from './BuilderStats';
import { BuilderWeeklyStats } from './BuilderWeeklyStats';

export async function BuilderProfile({ builder }: { builder: BasicUserInfo }) {
  const [builderNft, builderStats, builderActivities = [], { scouts = [], totalNftsSold = 0, totalScouts = 0 } = {}] =
    builder.builderStatus === 'approved'
      ? await Promise.all([
          prisma.builderNft.findUnique({
            where: {
              builderId_season: {
                builderId: builder.id,
                season: currentSeason
              }
            },
            select: {
              imageUrl: true,
              currentPrice: true
            }
          }),
          getBuilderStats(builder.id),
          getBuilderActivities({ builderId: builder.id, take: 5 }),
          getBuilderScouts(builder.id)
        ])
      : [];

  if (!builder.githubLogin) {
    return (
      <Stack gap={2} alignItems='center'>
        <Typography>Connect your GitHub account to apply as a Builder.</Typography>
        <Suspense>
          <JoinGithubButton />
        </Suspense>
      </Stack>
    );
  }

  if (builder.builderStatus === 'applied') {
    return (
      <Stack gap={2} alignItems='center'>
        <Typography>Your Builder account is pending approval. Check back soon!</Typography>
      </Stack>
    );
  }

  if (builder.builderStatus === 'rejected') {
    return (
      <Stack gap={2} alignItems='center'>
        <Typography>
          Your Builder account was not approved. Submit an appeal for review{' '}
          <Link href='https://appeal.scoutgame.xyz/'>here</Link> if you think this was a mistake.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={3}>
      {builder.builderStatus === 'banned' ? (
        <Alert severity='error'>
          <Typography>
            Your builder account has been banned. Submit an appeal for review{' '}
            <Link href='https://appeal.scoutgame.xyz/'>here</Link> to get unbanned.
          </Typography>
        </Alert>
      ) : null}
      <BuilderStats
        nftImageUrl={builderNft?.imageUrl}
        username={builder.username}
        builderPoints={builderStats?.seasonPoints}
        totalScouts={totalScouts}
        totalNftsSold={totalNftsSold}
        currentNftPrice={builderNft?.currentPrice}
      />
      <Stack gap={0.5}>
        <Typography color='secondary'>This Week</Typography>
        <BuilderWeeklyStats gemsCollected={builderStats?.gemsCollected} rank={builderStats?.rank} />
      </Stack>
      <Stack gap={0.5}>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Typography color='secondary'>Recent Activity</Typography>
          <Link href='/notifications'>
            <Typography color='primary'>View All</Typography>
          </Link>
        </Stack>
        {builderActivities.length > 0 ? (
          <BuilderActivitiesList activities={builderActivities} />
        ) : (
          <Typography>No activity yet. Start contributing or scouting to build your profile!</Typography>
        )}
      </Stack>
      <Stack gap={0.5}>
        <Typography color='secondary'>Scouted By</Typography>
        {scouts.length > 0 ? (
          <ScoutsGallery scouts={scouts} />
        ) : (
          <Typography>No Scouts have discovered you yet. Keep building and they'll find you!</Typography>
        )}
      </Stack>
    </Stack>
  );
}
