import { prisma } from '@charmverse/core';

import { getAccessibleMemberPropertiesBySpace } from 'lib/members/getAccessibleMemberPropertiesBySpace';
import { getMemberSearchValue } from 'lib/members/getMemberSearchValue';
import { getSpaceMemberSearchParams } from 'lib/members/getSpaceMemberSearchParams';
import type { Member } from 'lib/members/interfaces';
import { getPropertiesWithValues } from 'lib/members/utils';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

export async function getSpaceMembers({
  requestingUserId,
  spaceId,
  search
}: {
  requestingUserId?: string;
  spaceId: string;
  search?: string;
}) {
  const whereOr = getSpaceMemberSearchParams(search || '');
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
          },
          googleAccounts: true,
          telegramUser: true,
          discordUser: true
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
        const { memberPropertyValues = [], ...userData } = spaceRole.user;
        const roles = spaceRole.spaceRoleToRole.map((sr) => sr.role);

        const nameProperty = visibleProperties.find((property) => property.type === 'name') ?? null;
        const memberNameProperty = memberPropertyValues.find((prop) => prop.memberPropertyId === nameProperty?.id);
        const username = (memberNameProperty?.value as string | undefined) || userData.username;
        return {
          id: userData.id,
          createdAt: userData.createdAt,
          deletedAt: userData.deletedAt || undefined,
          updatedAt: userData.updatedAt,
          profile: userData.profile || undefined,
          avatar: userData.avatar || undefined,
          avatarTokenId: userData.avatarTokenId || undefined,
          username,
          onboarded: spaceRole.onboarded,
          isAdmin: spaceRole.isAdmin,
          isGuest: !!spaceRole.isGuest && !spaceRole.isAdmin,
          joinDate: spaceRole.createdAt.toISOString(),
          hasNftAvatar: hasNftAvatar(spaceRole.user),
          properties: getPropertiesWithValues(visibleProperties, memberPropertyValues),
          searchValue: getMemberSearchValue(spaceRole.user),
          roles
        };
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
