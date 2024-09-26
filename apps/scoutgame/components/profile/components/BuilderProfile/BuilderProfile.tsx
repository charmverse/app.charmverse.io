'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { Stack, Typography } from '@mui/material';
import Image from 'next/image';
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
    builder.builder
      ? await Promise.all([
          prisma.builderNft.findUnique({
            where: {
              id: builder.id
            },
            select: {
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
        <Typography>Connect to GitHub to sign up and verify your code contributions.</Typography>
        <Image src='/images/github-logo.png' width={120} height={30} alt='github' />
        <Suspense>
          <JoinGithubButton />
        </Suspense>
      </Stack>
    );
  }

  if (!builder.builder) {
    return (
      <Stack gap={2} alignItems='center'>
        <Image src='/images/github-logo.png' width={120} height={30} alt='github' />
        <Typography>Your builder application is under review</Typography>;
      </Stack>
    );
  }

  return (
    <Stack gap={3}>
      <BuilderStats
        avatar={builder.avatar}
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
        <BuilderActivitiesList activities={builderActivities} />
      </Stack>
      <Stack gap={0.5}>
        <Typography color='secondary'>Scouted By</Typography>
        {scouts.length > 0 ? <ScoutsGallery scouts={scouts} /> : <Typography>No scouts yet</Typography>}
      </Stack>
    </Stack>
  );
}
