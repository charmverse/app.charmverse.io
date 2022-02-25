
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser, requireSpaceUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Role } from 'models';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

const requireAdmin = (req: NextApiRequest, res: NextApiResponse, next: Function) => {
  return requireSpaceUser(req.query.id as string, 'admin')(req, res, next);
};

handler.use(requireUser)
  .use(requireAdmin)
  .put(updateContributor)
  .delete(deleteContributor);

async function updateContributor (req: NextApiRequest, res: NextApiResponse) {
  await prisma.spaceRole.update({
    where: {
      spaceId_userId: {
        userId: req.query.userId as string,
        spaceId: req.query.id as string
      }
    },
    data: {
      role: req.body.role as Role
    }
  });
  res.status(200).json({ ok: true });
}

async function deleteContributor (req: NextApiRequest, res: NextApiResponse) {
  await prisma.spaceRole.delete({
    where: {
      spaceId_userId: {
        userId: req.query.userId as string,
        spaceId: req.query.id as string
      }
    }
  });
  res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
