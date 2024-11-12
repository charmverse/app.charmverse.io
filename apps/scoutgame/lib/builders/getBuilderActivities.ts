import type { GemsReceiptType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { isTruthy } from '@root/lib/utils/types';

import type { BasicUserInfo } from 'lib/users/interfaces';
import { BasicUserInfoSelect } from 'lib/users/queries';

export type BuilderActivityType = 'nft_purchase' | 'merged_pull_request';

type NftPurchaseActivity = {
  type: 'nft_purchase';
  scout: {
    path: string;
    displayName: string;
  };
};

type MergedPullRequestActivity = {
  type: 'github_event';
  contributionType: GemsReceiptType;
  gems: number;
  repo: string;
  url: string;
  bonusPartner: BonusPartner | null;
};

export type BuilderActivity = BasicUserInfo & {
  id: string;
  createdAt: Date;
} & (NftPurchaseActivity | MergedPullRequestActivity);

export async function getBuilderActivities({
  builderId,
  limit = 10
}: {
  builderId?: string;
  limit: number;
}): Promise<BuilderActivity[]> {
  const builderEvents = await prisma.builderEvent.findMany({
    where: {
      builder: {
        id: builderId,
        builderStatus: 'approved'
      },
      type: {
        in: ['nft_purchase', 'merged_pull_request', 'daily_commit']
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    select: {
      builder: {
        select: BasicUserInfoSelect
      },
      bonusPartner: true,
      id: true,
      createdAt: true,
      type: true,
      nftPurchaseEvent: {
        select: {
          scout: {
            select: {
              path: true,
              displayName: true
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
        select: {
          url: true,
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
          ...event.builder,
          id: event.id,
          createdAt: event.createdAt,
          type: 'nft_purchase' as const,
          scout: event.nftPurchaseEvent.scout
        };
      } else if (
        (event.type === 'merged_pull_request' || event.type === 'daily_commit') &&
        event.githubEvent &&
        event.gemsReceipt
      ) {
        return {
          ...event.builder,
          id: event.id,
          createdAt: event.createdAt,
          type: 'github_event' as const,
          contributionType: event.gemsReceipt.type,
          gems: event.gemsReceipt.value,
          repo: `${event.githubEvent.repo.owner}/${event.githubEvent.repo.name}`,
          url: event.githubEvent.url,
          bonusPartner: event.bonusPartner as BonusPartner | null
        };
      } else {
        return null;
      }
    })
    .filter(isTruthy);
}
