import type { Page, Bounty } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { rewardWithUsersInclude } from '@root/lib/rewards/getReward';
import type { RewardReviewer } from '@root/lib/rewards/interfaces';
import { mapDbRewardToReward } from '@root/lib/rewards/mapDbRewardToReward';

export type RewardTemplate = Bounty & {
  assignedSubmitters: string[] | null;
  reviewers: RewardReviewer[];
  allowedSubmitterRoles: string[] | null;
  page: Page;
};

export async function getRewardTemplate({ pageId }: { pageId: string }): Promise<RewardTemplate> {
  const { page, ...reward } = await prisma.bounty.findFirstOrThrow({
    where: {
      page: {
        id: pageId
      }
    },
    include: {
      ...rewardWithUsersInclude(),
      page: true
    }
  });

  if (!page) {
    throw new Error('no page found for reward');
  }

  const { applications, ...mappedReward } = mapDbRewardToReward(reward);

  return {
    ...mappedReward,
    page
  };
}
