import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getBuilderScouts } from 'lib/builders/getBuilderScouts';
import { getBuilderStats } from 'lib/builders/getBuilderStats';
import type { BasicUserInfo } from 'lib/users/interfaces';

import { PublicBuilderProfileContainer } from './PublicBuilderProfileContainer';

export async function PublicBuilderProfile({ publicUser }: { publicUser: BasicUserInfo }) {
  const builderId = publicUser.id;
  const isApprovedBuilder = publicUser.builderStatus === 'approved';

  const [
    builderNft,
    { allTimePoints = 0, seasonPoints = 0, rank = 0, gemsCollected = 0 } = {},
    builderActivities = [],
    { scouts = [], totalNftsSold = 0, totalScouts = 0 } = {}
  ] = isApprovedBuilder
    ? await Promise.all([
        prisma.builderNft.findUnique({
          where: {
            builderId_season: {
              builderId: publicUser.id,
              season: currentSeason
            }
          },
          select: {
            imageUrl: true,
            currentPrice: true
          }
        }),
        getBuilderStats(builderId),
        getBuilderActivities({ builderId, limit: 200 }),
        getBuilderScouts(builderId)
      ])
    : [];

  return (
    <PublicBuilderProfileContainer
      scouts={scouts}
      builder={{
        ...publicUser,
        nftImageUrl: builderNft?.imageUrl,
        price: builderNft?.currentPrice ?? BigInt(0)
      }}
      allTimePoints={allTimePoints}
      seasonPoints={seasonPoints}
      totalScouts={totalScouts}
      totalNftsSold={totalNftsSold}
      builderActivities={builderActivities}
      gemsCollected={gemsCollected}
      rank={rank}
    />
  );
}
