import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { DataNotFoundError } from 'lib/utilities/errors';

import type { RewardReviewer, RewardWithUsers } from './interfaces';

export function rewardWithUsersInclude() {
  return {
    applications: {
      select: {
        id: true,
        createdBy: true,
        status: true
      }
    },
    permissions: {
      select: {
        userId: true,
        roleId: true,
        permissionLevel: true
      }
    }
  };
}

export async function getReward({
  rewardId,
  tx = prisma
}: {
  tx?: Prisma.TransactionClient;
  rewardId: string;
}): Promise<RewardWithUsers | null> {
  return tx.bounty
    .findUnique({
      where: {
        id: rewardId
      },
      include: rewardWithUsersInclude()
    })
    .then((reward) => {
      if (!reward) {
        return null;
      }

      const reviewers = reward.permissions
        .filter((p) => (p.roleId || p.userId) && p.permissionLevel === 'reviewer')
        .map((p) => {
          const group = p.roleId ? 'role' : 'user';
          return {
            group,
            id: (group === 'role' ? p.roleId : p.userId) as string
          } as RewardReviewer;
        });

      const allowedSubmitterRoles = reward.permissions.filter((p) => p.permissionLevel === 'submitter' && p.roleId);

      const rewardWithUsers: RewardWithUsers = {
        ...reward,
        applications: reward.applications,
        reviewers,
        allowedSubmitterRoles:
          allowedSubmitterRoles.length > 0 ? allowedSubmitterRoles.map((r) => r.roleId as string) : null
      };
      return rewardWithUsers;
    });
}

export async function getRewardOrThrow({
  rewardId,
  tx = prisma
}: {
  tx?: Prisma.TransactionClient;
  rewardId: string;
}): Promise<RewardWithUsers> {
  const reward = await getReward({ rewardId, tx });
  if (!reward) {
    throw new DataNotFoundError(`Reward with id ${rewardId} not found`);
  }
  return reward;
}
