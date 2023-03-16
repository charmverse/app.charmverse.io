import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { getAccessibleMemberPropertiesBySpace } from 'lib/members/getAccessibleMemberPropertiesBySpace';
import type { Member } from 'lib/members/interfaces';
import { getPropertiesWithValues } from 'lib/members/utils';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

export async function getSpaceMembers({
  whereOr = [],
  requestingUserId,
  spaceId
}: {
  whereOr?: Prisma.SpaceRoleWhereInput[];
  requestingUserId?: string;
  spaceId: string;
}) {
  const visibleProperties = await getAccessibleMemberPropertiesBySpace({ requestingUserId, spaceId });

  const spaceRoles = await prisma.spaceRole.findMany({
    where:
      whereOr.length !== 0
        ? {
            spaceId,
            OR: whereOr
          }
        : {
            spaceId
          },
    include: {
      user: {
        include: {
          profile: true,
          memberPropertyValues: {
            where: {
              spaceId
            }
          }
        }
      },
      spaceRoleToRole: {
        include: {
          role: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  return (
    spaceRoles
      .map((spaceRole): Member => {
        const { memberPropertyValues = [], id, ...userData } = spaceRole.user;
        const roles = spaceRole.spaceRoleToRole?.map((sr) => sr.role);

        const nameProperty = visibleProperties.find((property) => property.type === 'name') ?? null;
        const memberNameProperty = memberPropertyValues.find((prop) => prop.memberPropertyId === nameProperty?.id);
        return {
          id,
          ...userData,
          username: memberNameProperty?.value || userData.username,
          addresses: [],
          onboarded: spaceRole.onboarded,
          isAdmin: spaceRole.isAdmin,
          joinDate: spaceRole.createdAt.toISOString(),
          hasNftAvatar: hasNftAvatar(spaceRole.user),
          properties: getPropertiesWithValues(visibleProperties, memberPropertyValues),
          roles
        } as Member;
      })
      // filter out deleted members
      .filter((member) => !member.deletedAt)
      // sort members alphabetically
      .sort((a, b) => {
        const first = a.username.toLowerCase();
        const second = b.username.toLowerCase();

        if (first < second) {
          return -1;
        } else if (second > first) {
          return 1;
        } else {
          return 0;
        }
      })
  );
}
