import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { rewardWithUsersInclude } from '@packages/lib/rewards/getReward';
import { mapDbRewardToReward } from '@packages/lib/rewards/mapDbRewardToReward';

import type { RewardTemplate } from './getRewardTemplate';

export async function getRewardTemplates({
  spaceId,
  userId
}: {
  spaceId: string;
  userId: string;
}): Promise<RewardTemplate[]> {
  const isAdmin = await prisma.spaceRole.findFirst({
    where: {
      userId,
      spaceId,
      isAdmin: true
    }
  });

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
        ...rewardWithUsersInclude(),
        page: true
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

          return { ...mappedReward, page };
        })
    );
}
