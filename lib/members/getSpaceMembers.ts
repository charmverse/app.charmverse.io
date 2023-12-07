import type { MemberProperty } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import {
  getAccessibleMemberPropertiesBySpace,
  getAllMemberPropertiesBySpace
} from 'lib/members/getAccessibleMemberPropertiesBySpace';
import { getMemberSearchValue } from 'lib/members/getMemberSearchValue';
import { getSpaceMemberSearchParams } from 'lib/members/getSpaceMemberSearchParams';
import type { Member } from 'lib/members/interfaces';
import { getPropertiesWithValues } from 'lib/members/utils';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';
import { replaceS3Domain } from 'lib/utilities/url';

import { getMemberUsername } from './getMemberUsername';

export async function getSpaceMembers({
  requestingUserId,
  spaceId,
  search,
  skipAccessCheck
}: {
  requestingUserId?: string;
  spaceId: string;
  search?: string;
  skipAccessCheck?: boolean;
}) {
  const whereOr = getSpaceMemberSearchParams(search || '');
  const visibleProperties = skipAccessCheck
    ? await getAllMemberPropertiesBySpace({ spaceId })
    : await getAccessibleMemberPropertiesBySpace({ requestingUserId, spaceId });
  const visiblePropertiesMap = (visibleProperties as MemberProperty[]).reduce((acc, prop) => {
    acc[prop.id] = prop.name;
    if (prop.options instanceof Array) {
      for (const option of prop.options) {
        if (option) {
          acc[(option as any).id] = (option as any).name;
        }
      }
    }
    return acc;
  }, {} as Record<string, string>);
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

  const memberUsernameRecord: Record<string, string> = {};

  for (const spaceRole of spaceRoles) {
    const memberUsername = await getMemberUsername({ spaceRoleId: spaceRole.id });
    memberUsernameRecord[spaceRole.id] = memberUsername;
  }

  return (
    spaceRoles
      .map((spaceRole): Member => {
        const { memberPropertyValues = [], ...userData } = spaceRole.user;
        const roles = spaceRole.spaceRoleToRole.map((sr) => sr.role);
        return {
          id: userData.id,
          createdAt: userData.createdAt,
          deletedAt: userData.deletedAt || undefined,
          updatedAt: userData.updatedAt,
          profile: (userData.profile as Member['profile']) || undefined,
          avatar: replaceS3Domain(userData.avatar || undefined),
          avatarTokenId: userData.avatarTokenId || undefined,
          username: memberUsernameRecord[spaceRole.id],
          path: userData.path,
          onboarded: spaceRole.onboarded,
          isAdmin: spaceRole.isAdmin,
          isGuest: !!spaceRole.isGuest && !spaceRole.isAdmin,
          joinDate: spaceRole.createdAt.toISOString(),
          hasNftAvatar: hasNftAvatar(spaceRole.user),
          properties: getPropertiesWithValues(visibleProperties, memberPropertyValues),
          searchValue: getMemberSearchValue(spaceRole.user, visiblePropertiesMap, memberUsernameRecord[spaceRole.id]),
          roles,
          isBot: userData.isBot ?? undefined
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
