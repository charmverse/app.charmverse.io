import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { getVisibleMemberPropertiesBySpace } from 'lib/members/getVisibleMemberPropertiesBySpace';
import type { Member } from 'lib/members/interfaces';
import { getPropertiesWithValues } from 'lib/members/utils';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getMembers);

async function getMembers (req: NextApiRequest, res: NextApiResponse<Member[]>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
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

  const visibleProperties = await getVisibleMemberPropertiesBySpace({ userId, spaceId });
  const roleMemberProperty = visibleProperties.find(visibleProperty => visibleProperty.type === 'role');

  const members = spaceRoles.map((spaceRole): Member => {
    const { memberPropertyValues = [], id, ...userData } = spaceRole.user;
    const roles = spaceRole.spaceRoleToRole?.map(sr => sr.role);

    return {
      id,
      ...userData,
      addresses: [],
      isAdmin: spaceRole.isAdmin,
      joinDate: spaceRole.createdAt.toISOString(),
      hasNftAvatar: hasNftAvatar(spaceRole.user),
      properties: getPropertiesWithValues(visibleProperties, memberPropertyValues),
      roles
    } as Member;
  })
    .sort((a, b) => b.createdAt > a.createdAt ? -1 : 1); // sort oldest first

  return res.status(200).json(members);
}

export default withSessionRoute(handler);
