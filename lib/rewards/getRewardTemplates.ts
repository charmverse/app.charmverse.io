import { InvalidInputError } from '@charmverse/core/errors';
import type { SpaceResourcesRequest } from '@charmverse/core/permissions';
import type { Page, Bounty } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

export type RewardTemplate = { reward: Bounty; page: Page };

export async function getRewardTemplates({ spaceId, userId }: SpaceResourcesRequest): Promise<RewardTemplate[]> {
  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!spaceRole) {
    return [];
  }

  return prisma.bounty
    .findMany({
      where: {
        spaceId,
        page: {
          type: 'bounty_template'
        }
      },
      include: {
        page: true
      }
    })
    .then((bounties) =>
      bounties
        .map(({ page, ...reward }) => ({ reward, page: page! }))
        // remove bounties that have no page (unexpected case)
        .filter((bounty) => bounty.page)
    );
}
