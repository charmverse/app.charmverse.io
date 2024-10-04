import type { GemsReceiptType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@root/lib/utils/types';

import type { BasicUserInfo } from 'lib/users/interfaces';
import { BasicUserInfoSelect } from 'lib/users/queries';

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
  url: string;
  bonusPartner: string | null;
};

export type BuilderActivity = BasicUserInfo & {
  id: string;
  createdAt: Date;
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
      type: {
        in: ['nft_purchase', 'merged_pull_request']
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take,
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
              username: true
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
          },
          pullRequestNumber: true
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
          scout: event.nftPurchaseEvent.scout.username
        };
      } else if (event.type === 'merged_pull_request' && event.githubEvent && event.gemsReceipt) {
        return {
          ...event.builder,
          id: event.id,
          createdAt: event.createdAt,
          type: 'merged_pull_request' as const,
          contributionType: event.gemsReceipt.type,
          gems: event.gemsReceipt.value,
          repo: `${event.githubEvent.repo.owner}/${event.githubEvent.repo.name}`,
          url: `https://github.com/${event.githubEvent.repo.owner}/${event.githubEvent.repo.name}/pull/${event.githubEvent.pullRequestNumber}`,
          bonusPartner: event.bonusPartner
        };
      } else {
        return null;
      }
    })
    .filter(isTruthy);
}
