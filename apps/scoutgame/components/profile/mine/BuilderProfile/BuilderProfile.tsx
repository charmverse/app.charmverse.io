'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { Stack, Typography } from '@mui/material';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/utils';
import Link from 'next/link';

import { ScoutsGallery } from 'components/scout/ScoutsGallery';
import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getBuilderScouts } from 'lib/builders/getBuilderScouts';
import { getBuilderWeeklyStats } from 'lib/builders/getBuilderWeeklyStats';

import { BuilderActivitiesList } from '../../../builder/BuilderActivitiesList';

import { BuilderStats } from './BuilderStats';
import { BuilderWeeklyStats } from './BuilderWeeklyStats';

export async function BuilderProfile({ builderId }: { builderId: string }) {
  const currentWeek = getCurrentWeek();

  const builder = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
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

  const builderActivities = await getBuilderActivities({ builderId, take: 5 });
  const builderWeeklyStats = await getBuilderWeeklyStats(builderId);

  const { totalScouts, totalNftsSold, scouts } = await getBuilderScouts(builderId);

  return (
    <Stack gap={3}>
      <BuilderStats
        avatar={builder.avatar || ''}
        username={builder.username}
        builderPoints={builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0}
        totalScouts={totalScouts}
        totalNftsSold={totalNftsSold}
        currentNftPrice={Number(builder.builderNfts[0]?.currentPrice || 0)}
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
