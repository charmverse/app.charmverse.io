
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { Member } from 'lib/members/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getMembers);

async function getMembers (req: NextApiRequest, res: NextApiResponse<Member[]>) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: req.query.id as string
    },
    include: {
      user: true
    }
  });
  const members = spaceRoles.map((spaceRole): Member => {
    return {
      ...spaceRole.user,
      addresses: [],
      isAdmin: spaceRole.isAdmin,
      joinDate: spaceRole.createdAt.toISOString(),
      hasNftAvatar: hasNftAvatar(spaceRole.user),
      properties: []
    } as Member;
  })
    .sort((a, b) => b.createdAt > a.createdAt ? -1 : 1); // sort oldest first
  return res.status(200).json(members);
}

export default withSessionRoute(handler);
