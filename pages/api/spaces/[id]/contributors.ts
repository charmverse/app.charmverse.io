
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Contributor, Role } from 'models';
import { prisma } from 'db';

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
      role: spaceRole.role as Role
    };
  });
  return res.status(200).json(contributors);
}

export default withSessionRoute(handler);
