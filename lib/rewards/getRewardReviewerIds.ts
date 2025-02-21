import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/lib/utils/types';

export async function getRewardReviewerIds(bountyId: string): Promise<string[]> {
  const bounty = await prisma.bounty.findUniqueOrThrow({
    where: {
      id: bountyId
    },
    select: {
      spaceId: true,
      permissions: {
        select: {
          roleId: true,
          userId: true,
          permissionLevel: true
        }
      },
      applications: {
        select: {
          id: true
        }
      }
    }
  });

  const bountyReviewers = bounty.permissions.filter(({ permissionLevel }) => permissionLevel === 'reviewer');
  const bountyReviewerRoleIds = bountyReviewers.map(({ roleId }) => roleId).filter(isTruthy);
  const bountyRoleBasedReviewers = await prisma.spaceRoleToRole.findMany({
    where: {
      roleId: {
        in: bountyReviewerRoleIds
      }
    },
    select: {
      spaceRole: {
        select: {
          userId: true
        }
      }
    }
  });

  const bountyReviewerUserIds = bountyReviewers.map(({ userId }) => userId).filter(isTruthy);
  const bountyRoleBasedReviewerUserIds = bountyRoleBasedReviewers
    .map(({ spaceRole }) => spaceRole.userId)
    .filter(isTruthy);

  return Array.from(new Set([...bountyRoleBasedReviewerUserIds, ...bountyReviewerUserIds]));
}
