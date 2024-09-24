import { prisma } from '@charmverse/core/prisma-client';
import { Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { currentSeason } from '@packages/scoutgame/utils';

import { BuildersGallery } from 'components/builder/BuildersGallery';
import { getScoutedBuilders } from 'lib/scouts/getScoutedBuilders';

import { ScoutStats } from './ScoutStats';

export async function ScoutProfile({ userId }: { userId: string }) {
  const seasonStats = await prisma.userSeasonStats.findUnique({
    where: {
      userId_season: {
        userId,
        season: currentSeason
      }
    },
    select: {
      pointsEarnedAsScout: true
    }
  });

  const scoutedBuilders = await getScoutedBuilders({ scoutId: userId });

  const buildersScouted = scoutedBuilders.length;
  const nftsPurchasedThisSeason = scoutedBuilders.reduce((acc, builder) => acc + (builder.nfts || 0), 0);

  return (
    <Stack gap={1}>
      <ScoutStats
        buildersScouted={buildersScouted}
        nftsPurchased={nftsPurchasedThisSeason}
        scoutPoints={seasonStats?.pointsEarnedAsScout || 0}
      />
      <Stack>
        <Typography variant='subtitle1' my={1} color='secondary' fontWeight='500'>
          Scouted Builders
        </Typography>
        <BuildersGallery builders={scoutedBuilders} />
      </Stack>
    </Stack>
  );
}
