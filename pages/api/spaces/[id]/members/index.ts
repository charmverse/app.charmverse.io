import type { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { getAccessibleMemberPropertiesBySpace } from 'lib/members/getAccessibleMemberPropertiesBySpace';
import type { Member, PublicMember } from 'lib/members/interfaces';
import { getPropertiesWithValues } from 'lib/members/utils';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';
import { deterministicRandomName } from 'lib/utilities/randomName';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getMembers);

async function getMembers(req: NextApiRequest, res: NextApiResponse<(Member | PublicMember)[]>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user?.id as string | undefined;

  const { error } = await hasAccessToSpace({ userId, spaceId });

  // Cleanup in future when we simplify members endpoint
  // User has no access, return a subset of users
  if (error) {
    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId
      },
      select: {
        user: {
          select: {
            id: true
          }
        }
      }
    });

    const mappedUsers: PublicMember[] = spaceRoles.map((sr) => ({
      id: sr.user.id,
      username: deterministicRandomName(sr.user.id)
    }));

    return res.status(200).json(mappedUsers);
  }
  // Proceed as normal
  const search = (req.query.search as string) ?? '';

  const whereOr: Prisma.Enumerable<Prisma.SpaceRoleWhereInput> = [];

  if (search.length !== 0) {
    whereOr.push({
      user: {
        username: {
          search: `${search
            .split(/\s/)
            .filter((s) => s)
            .join(' & ')}:*`
        }
      }
    });

    whereOr.push({
      spaceRoleToRole: {
        some: {
          role: {
            name: {
              search: `${search
                .split(/\s/)
                .filter((s) => s)
                .join(' & ')}:*`
            }
          }
        }
      }
    });

    whereOr.push({
      user: {
        profile: {
          description: {
            search: `${search
              .split(/\s/)
              .filter((s) => s)
              .join(' & ')}:*`
          }
        }
      }
    });

    whereOr.push({
      user: {
        memberPropertyValues: {
          some: {
            OR: [
              {
                value: {
                  array_contains: search
                }
              },
              {
                value: {
                  string_contains: search
                }
              }
            ]
          }
        }
      }
    });
  }

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

  const visibleProperties = await getAccessibleMemberPropertiesBySpace({ requestingUserId: userId, spaceId });

  const members = spaceRoles
    .map((spaceRole): Member => {
      const { memberPropertyValues = [], id, ...userData } = spaceRole.user;
      const roles = spaceRole.spaceRoleToRole?.map((sr) => sr.role);

      return {
        id,
        ...userData,
        addresses: [],
        onboarded: spaceRole.onboarded,
        isAdmin: spaceRole.isAdmin,
        joinDate: spaceRole.createdAt.toISOString(),
        hasNftAvatar: hasNftAvatar(spaceRole.user),
        properties: getPropertiesWithValues(visibleProperties, memberPropertyValues),
        roles
      } as Member;
    })
    .filter((member) => !member.deletedAt) // filter out deleted members
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
    }); // sort members alphabetically

  return res.status(200).json(members);
}

export default withSessionRoute(handler);
