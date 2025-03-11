import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getSpaceMembers } from 'lib/members/getSpaceMembers';
import type { Member } from 'lib/members/interfaces';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getMembers);

export const config = {
  api: {
    // silence errors about response size
    // https://nextjs.org/docs/messages/api-routes-response-size-limit
    responseLimit: false
  }
};

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
            id: true,
            username: true
          }
        }
      }
    });

    const mappedUsers: Member[] = spaceRoles.map((sr) => ({
      id: sr.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      onboarded: true,
      path: 'not-found',
      joinDate: new Date().toISOString(),
      properties: [],
      roles: [],
      username: sr.user.username,
      searchValue: ''
    }));

    return res.status(200).json(mappedUsers);
  }

  // Proceed as normal
  const members = await getSpaceMembers({ spaceId, requestingUserId: userId, search: req.query.search as string });

  return res.status(200).json(members);
}

export default withSessionRoute(handler);
