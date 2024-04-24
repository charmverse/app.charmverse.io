import type { SpaceResourcesRequest } from '@charmverse/core/permissions';
import type { Page, Bounty, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { rewardWithUsersInclude } from 'lib/rewards/getReward';
import type { RewardReviewer } from 'lib/rewards/interfaces';
import { mapDbRewardToReward } from 'lib/rewards/mapDbRewardToReward';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

export type RewardTemplate = {
  reward: Bounty & {
    assignedSubmitters: string[] | null;
    reviewers: RewardReviewer[];
    allowedSubmitterRoles: string[] | null;
  };
  page: Page;
};

export async function getRewardTemplates({ spaceId, userId }: SpaceResourcesRequest): Promise<RewardTemplate[]> {
  const { spaceRole, isAdmin } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!spaceRole) {
    return [];
  }

  const bountyWhereInput: Prisma.BountyWhereInput = {
    spaceId,
    page: {
      type: 'bounty_template',
      deletedAt: null
    }
  };

  return prisma.bounty
    .findMany({
      where: {
        OR: [
          {
            ...bountyWhereInput,
            status: 'draft',
            createdBy: isAdmin ? undefined : userId
          },
          {
            ...bountyWhereInput,
            status: {
              notIn: ['draft']
            }
          }
        ]
      },
      include: {
        page: true,
        ...rewardWithUsersInclude()
      }
    })
    .then((bounties) =>
      bounties
        .map(({ page, ...reward }) => ({ reward, page: page! }))
        // remove rewards that have no page (unexpected case)
        .filter((bounty) => bounty.page)

        // return reviewers in templates
        .map(({ reward, page }) => {
          const { applications, ...mappedReward } = mapDbRewardToReward(reward);

          return {
            reward: mappedReward,
            page
          };
        })
    );
}
