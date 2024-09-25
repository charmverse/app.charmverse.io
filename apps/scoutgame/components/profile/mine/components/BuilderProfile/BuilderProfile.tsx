'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { Stack, Typography } from '@mui/material';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { ScoutsGallery } from 'components/common/Gallery/ScoutsGallery';
import { BuilderActivitiesList } from 'components/profile/components/BuilderActivitiesList';
import { JoinGithubButton } from 'components/welcome/components/github/JoinGithubButton';
import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getBuilderScouts } from 'lib/builders/getBuilderScouts';
import { getBuilderWeeklyStats } from 'lib/builders/getBuilderWeeklyStats';

import { BuilderStats } from './BuilderStats';
import { BuilderWeeklyStats } from './BuilderWeeklyStats';

export async function BuilderProfile({ builderId }: { builderId: string }) {
  const currentWeek = getCurrentWeek();

  const builder = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      builder: true,
      username: true,
      avatar: true,
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          currentPrice: true
        }
      },
      userWeeklyStats: {
        where: {
          week: currentWeek
        },
        select: {
          gemsCollected: true
        }
      }
    }
  });

  const builderActivities = builder.builder ? await getBuilderActivities({ builderId, take: 5 }) : [];
  const builderWeeklyStats = builder.builder
    ? await getBuilderWeeklyStats(builderId)
    : {
        gemsCollected: 0,
        rank: 0
      };

  const { totalScouts, totalNftsSold, scouts } = builder.builder
    ? await getBuilderScouts(builderId)
    : {
        totalScouts: 0,
        totalNftsSold: 0,
        scouts: []
      };

  if (!builder.builder) {
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

  return (
    <Stack gap={3}>
      <BuilderStats
        avatar={builder.avatar}
        username={builder.username}
        builderPoints={builder.userSeasonStats[0]?.pointsEarnedAsBuilder}
        totalScouts={totalScouts}
        totalNftsSold={totalNftsSold}
        currentNftPrice={builder.builderNfts[0]?.currentPrice}
      />
      <Stack gap={0.5}>
        <Typography color='secondary'>This Week</Typography>
        <BuilderWeeklyStats gemsCollected={builderWeeklyStats.gemsCollected} rank={builderWeeklyStats.rank} />
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
        <ScoutsGallery scouts={scouts} />
      </Stack>
    </Stack>
  );
}
