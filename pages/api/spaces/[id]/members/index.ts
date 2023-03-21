import type { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { getSpaceMembers } from 'lib/members/getSpaceMembers';
import type { Member } from 'lib/members/interfaces';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { deterministicRandomName } from 'lib/utilities/randomName';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getMembers);

async function getMembers(req: NextApiRequest, res: NextApiResponse<Member[]>) {
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

    const mappedUsers: Member[] = spaceRoles.map((sr) => ({
      id: sr.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      joinDate: new Date().toISOString(),
      properties: [],
      roles: [],
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

  const members = await getSpaceMembers({ spaceId, requestingUserId: userId, whereOr });

  return res.status(200).json(members);
}

export default withSessionRoute(handler);
