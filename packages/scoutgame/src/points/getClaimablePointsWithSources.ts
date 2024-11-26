import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserByIds } from '@packages/farcaster/getFarcasterUserById';
import { isTruthy } from '@packages/utils/types';

import type { BonusPartner } from '../bonus';
import { currentSeason, getCurrentWeek } from '../dates';

import { getClaimablePoints } from './getClaimablePoints';

export type UnclaimedPointsSource = {
  builders: {
    id: string;
    avatar: string | null;
    farcasterHandle?: string;
    displayName: string;
  }[];
  points: number;
  bonusPartners: BonusPartner[];
  repos: string[];
};

export async function getClaimablePointsWithSources(userId: string): Promise<UnclaimedPointsSource> {
  const { points, bonusPartners, pointsReceiptIds } = await getClaimablePoints({ season: currentSeason, userId });
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      id: {
        in: pointsReceiptIds
      }
    },
    select: {
      value: true,
      recipientId: true,
      event: {
        select: {
          type: true,
          builderId: true,
          githubEvent: {
            select: {
              repo: {
                select: {
                  name: true,
                  owner: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const builderIdScoutPointsRecord: Record<string, number> = {};
  for (const receipt of pointsReceipts) {
    if (receipt.event.type === 'gems_payout' && receipt.event.builderId !== receipt.recipientId) {
      if (!builderIdScoutPointsRecord[receipt.event.builderId]) {
        builderIdScoutPointsRecord[receipt.event.builderId] = receipt.value;
      } else {
        builderIdScoutPointsRecord[receipt.event.builderId] += receipt.value;
      }
    }
  }

  const topBuilderIds = Object.entries(builderIdScoutPointsRecord)
    .sort((builder1, builder2) => builder2[1] - builder1[1])
    .map(([builderId]) => builderId)
    .slice(0, 3);

  const builders = await prisma.scout.findMany({
    where: {
      id: { in: topBuilderIds }
    },
    select: {
      id: true,
      avatar: true,
      displayName: true,
      farcasterId: true
    }
  });

  const farcasterIds = builders.map((b) => b.farcasterId).filter(isTruthy);
  const farcasterUsers = await getFarcasterUserByIds(farcasterIds).catch((err) => {
    log.error('Could not retrieve farcaster profiles', { farcasterIds, error: err });
    return [];
  });
  const buildersWithFarcaster: UnclaimedPointsSource['builders'] = builders.map((builder) => {
    const farcasterUser = farcasterUsers.find((f) => f.fid === builder.farcasterId);
    return {
      ...builder,
      farcasterHandle: farcasterUser?.username
    };
  });

  const repos = await prisma.githubEvent.findMany({
    where: {
      builderEvent: {
        week: getCurrentWeek(),
        builderId: userId
      }
    },
    select: {
      repo: {
        select: {
          name: true,
          owner: true
        }
      }
    }
  });

  const uniqueRepos = Array.from(new Set(repos.map((repo) => `${repo.repo.owner}/${repo.repo.name}`)));

  return {
    builders: buildersWithFarcaster,
    points,
    bonusPartners,
    repos: uniqueRepos.slice(0, 3)
  };
}
