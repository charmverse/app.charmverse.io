import { prisma } from '@charmverse/core/prisma-client';

export async function getSpaceMemberMetadata({
  spaceIds,
  memberId
}: {
  spaceIds: string | string[];
  memberId: string;
}) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: {
        in: Array.isArray(spaceIds) ? spaceIds : [spaceIds]
      },
      userId: memberId
    },
    select: {
      isAdmin: true,
      isGuest: true,
      createdAt: true,
      spaceId: true,
      spaceRoleToRole: {
        include: {
          role: true
        }
      }
    }
  });

  const metadataBySpaceMap = spaceRoles.reduce<Record<string, { roles: string[]; joinDate: Date }>>(
    (acc, spaceRole) => {
      const roles = spaceRole.spaceRoleToRole?.map((spaceRoleToRole) => spaceRoleToRole.role.name);
      if (spaceRole.isAdmin) {
        roles.unshift('Admin');
      } else if (spaceRole.isGuest) {
        roles.unshift('Guest');
      } else {
        roles.unshift('Member');
      }
      acc[spaceRole.spaceId] = {
        roles,
        joinDate: spaceRole.createdAt
      };
      return acc;
    },
    {}
  );

  return metadataBySpaceMap;
}
