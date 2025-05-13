import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { InvalidInputError } from '@packages/utils/errors';

import { getRewardOrThrow } from './getReward';
import type { RewardReviewer, RewardWithUsers } from './interfaces';

export type RewardUsersUpdate = {
  reviewers?: RewardReviewer[];
  allowedSubmitterRoles?: string[] | null;
  assignedSubmitters?: string[] | null;
};

export async function setRewardUsers({
  rewardId,
  users,
  tx
}: {
  rewardId: string;
  users: RewardUsersUpdate;
  tx?: Prisma.TransactionClient;
}): Promise<RewardWithUsers> {
  if (!tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(tx);

  async function txHandler(_tx: Prisma.TransactionClient) {
    if (!stringUtils.isUUID(rewardId)) {
      throw new InvalidInputError(`Please provide a valid reward id`);
    }
    if (users.allowedSubmitterRoles !== undefined || users.assignedSubmitters !== undefined) {
      await _tx.bountyPermission.deleteMany({
        where: {
          bountyId: rewardId,
          permissionLevel: 'submitter'
        }
      });

      if (!!users.assignedSubmitters && !!users.assignedSubmitters.length) {
        await _tx.bountyPermission.createMany({
          data: users.assignedSubmitters.map((userId) => ({
            bountyId: rewardId,
            permissionLevel: 'submitter',
            userId
          }))
        });
      } else if (users?.allowedSubmitterRoles?.length) {
        await _tx.bountyPermission.createMany({
          data: users.allowedSubmitterRoles.map((roleId) => ({
            bountyId: rewardId,
            permissionLevel: 'submitter',
            roleId
          }))
        });
      }
    }

    if (users.reviewers) {
      await _tx.bountyPermission.deleteMany({
        where: {
          bountyId: rewardId,
          permissionLevel: 'reviewer'
        }
      });
      if (users.reviewers.length) {
        await _tx.bountyPermission.createMany({
          data: users.reviewers.map((reviewer) => ({
            bountyId: rewardId,
            permissionLevel: 'reviewer',
            roleId: reviewer.roleId,
            userId: reviewer.userId
          }))
        });
      }
    }
    return getRewardOrThrow({ rewardId, tx: _tx });
  }
}
