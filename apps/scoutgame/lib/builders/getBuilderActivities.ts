import type { GemsReceiptType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';
import { isTruthy } from '@root/lib/utils/types';

export type BuilderActivityType = 'nft_purchase' | 'merged_pull_request';

type NftPurchaseActivity = {
  type: 'nft_purchase';
  scout: string;
};

type MergedPullRequestActivity = {
  type: 'merged_pull_request';
  contributionType: GemsReceiptType;
  gems: number;
  repo: string;
};

export type BuilderActivity = {
  id: string;
  createdAt: Date;
  username: string;
  avatar: string;
  displayName: string;
} & (NftPurchaseActivity | MergedPullRequestActivity);

export async function getBuilderActivities({
  builderId,
  take = 5
}: {
  builderId?: string;
  take: number;
}): Promise<BuilderActivity[]> {
  const builderEvents = await prisma.builderEvent.findMany({
    where: {
      builderId,
      season: currentSeason
    },
    orderBy: {
      createdAt: 'desc'
    },
    take,
    select: {
      builder: {
        select: {
          username: true,
          avatar: true,
          displayName: true,
          id: true
        }
      },
      id: true,
      createdAt: true,
      type: true,
      nftPurchaseEvent: {
        select: {
          scout: {
            select: {
              username: true,
              avatar: true,
              displayName: true,
              id: true
            }
          },
          tokensPurchased: true
        }
      },
      gemsReceipt: {
        select: {
          type: true,
          value: true
        }
      },
      githubEvent: {
        where: {
          // Skip closed pull requests
          type: 'merged_pull_request'
        },
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
  });

  return builderEvents
    .map((event) => {
      if (event.type === 'nft_purchase' && event.nftPurchaseEvent) {
        return {
          id: event.id,
          createdAt: event.createdAt,
          type: 'nft_purchase' as const,
          scout: event.nftPurchaseEvent.scout.username,
          username: event.builder.username,
          avatar: event.builder.avatar || '',
          displayName: event.builder.displayName
        };
      } else if (event.type === 'merged_pull_request' && event.githubEvent && event.gemsReceipt) {
        return {
          id: event.id,
          createdAt: event.createdAt,
          type: 'merged_pull_request' as const,
          contributionType: event.gemsReceipt.type,
          gems: event.gemsReceipt.value,
          repo: `${event.githubEvent.repo.owner}/${event.githubEvent.repo.name}`,
          username: event.builder.username,
          avatar: event.builder.avatar || '',
          displayName: event.builder.displayName
        };
      } else {
        return null;
      }
    })
    .filter(isTruthy);
}
