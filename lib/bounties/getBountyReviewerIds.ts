import { prisma } from '@charmverse/core/prisma-client';

export async function getBountyReviewerIds(bountyId: string) {
  const bounty = await prisma.bounty.findUniqueOrThrow({
    where: {
      id: bountyId
    },
    select: {
      spaceId: true,
      permissions: {
        select: {
          roleId: true,
          userId: true
        }
      },
      applications: {
        select: {
          id: true
        }
      }
    }
  });

  const spaceId = bounty.spaceId;

  const bountyRoleIds = bounty.permissions.map(({ roleId }) => roleId).filter((roleId) => roleId);

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    },
    select: {
      userId: true,
      id: true,
      spaceRoleToRole: {
        select: {
          role: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  return spaceRoles
    .filter((spaceRole) => {
      const isReviewer = bounty.permissions.some((perm) =>
        perm.roleId ? bountyRoleIds.includes(perm.roleId) : perm.userId === spaceRole.userId
      );
      return isReviewer;
    })
    .map(({ userId }) => userId);
}
