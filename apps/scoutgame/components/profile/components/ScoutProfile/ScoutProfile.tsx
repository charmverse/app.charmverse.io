'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { Typography, Stack } from '@mui/material';
import { currentSeason } from '@packages/scoutgame/dates';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import { getScoutedBuilders } from 'lib/scouts/getScoutedBuilders';

import { ScoutStats } from './ScoutStats';

export async function ScoutProfile({ userId, isMobile }: { userId: string; isMobile?: boolean }) {
  const [seasonStats, scoutedBuilders] = await Promise.all([
    prisma.userSeasonStats.findUnique({
      where: {
        userId_season: {
          userId,
          season: currentSeason
        }
      },
      select: {
        pointsEarnedAsScout: true
      }
    }),
    getScoutedBuilders({ scoutId: userId })
  ]);

  const nftsPurchasedThisSeason = scoutedBuilders.reduce((acc, builder) => acc + (builder.nftsSold || 0), 0);

  return (
    <Stack gap={1}>
      <ScoutStats
        buildersScouted={scoutedBuilders.length}
        nftsPurchased={nftsPurchasedThisSeason}
        scoutPoints={seasonStats?.pointsEarnedAsScout}
      />
      <Stack>
        <Typography variant='subtitle1' my={1} color='secondary' fontWeight='500'>
          Scouted Builders
        </Typography>
        {scoutedBuilders.length > 0 ? (
          <BuildersGallery builders={scoutedBuilders} columns={3} size='small' />
        ) : (
          <Typography>You haven't scouted any Builders yet. Start exploring and discover talent!</Typography>
        )}
      </Stack>
    </Stack>
  );
}
