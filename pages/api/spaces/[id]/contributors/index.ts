
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Contributor } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getContributors);

async function getContributors (req: NextApiRequest, res: NextApiResponse<Contributor[]>) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: req.query.id as string
    },
    include: {
      user: true
    }
  });
  const contributors = spaceRoles.map((spaceRole): Contributor => {
    return {
      ...spaceRole.user,
      addresses: [],
      isAdmin: spaceRole.isAdmin,
      joinDate: spaceRole.createdAt.toISOString()
    } as Contributor;
  })
    .sort((a, b) => b.createdAt > a.createdAt ? -1 : 1); // sort oldest first
  return res.status(200).json(contributors);
}

export default withSessionRoute(handler);
