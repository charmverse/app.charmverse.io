import 'server-only';

import { Typography, Stack } from '@mui/material';
import { getScoutedBuilders } from '@packages/scoutgame/users/getScoutedBuilders';
import { getUserSeasonStats } from '@packages/scoutgame/users/getUserSeasonStats';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { ErrorSSRMessage } from '../../../common/ErrorSSRMessage';
import { BuildersGallery } from '../../../common/Gallery/BuildersGallery';

import { ScoutStats } from './ScoutStats';

export async function ScoutProfile({ userId }: { userId: string }) {
  const [error, data] = await safeAwaitSSRData(
    Promise.all([getUserSeasonStats(userId), getScoutedBuilders({ scoutId: userId })])
  );

  if (error) {
    return <ErrorSSRMessage />;
  }

  const [seasonStats, scoutedBuilders] = data;

  const nftsPurchasedThisSeason = scoutedBuilders.reduce((acc, builder) => acc + (builder.nftsSoldToScout || 0), 0);

  return (
    <Stack gap={1}>
      <ScoutStats
        buildersScouted={scoutedBuilders.length}
        nftsPurchased={nftsPurchasedThisSeason}
        scoutPoints={seasonStats?.pointsEarnedAsScout}
      />
      <Stack>
        <Typography variant='h5' my={2} color='secondary' fontWeight='500'>
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
