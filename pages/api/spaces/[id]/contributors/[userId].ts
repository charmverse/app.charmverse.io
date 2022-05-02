
import { NextApiRequest, NextApiResponse } from 'next';
import nc, { NextHandler } from 'next-connect';
import { onError, onNoMatch, requireUser, hasAccessToSpace } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Role } from 'models';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

const requireAdmin = async (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
  const userId = req.session.user.id;
  const { error } = await hasAccessToSpace({ userId, spaceId: req.query.id as string, adminOnly: true });
  if (error) {
    throw error;
  }
  next();
};

handler.use(requireUser)
  .use(requireAdmin)
  .put(updateContributor)
  .delete(deleteContributor);

async function updateContributor (req: NextApiRequest, res: NextApiResponse) {
  await prisma.spaceRole.update({
    where: {
      spaceUser: {
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
      spaceUser: {
        userId: req.query.userId as string,
        spaceId: req.query.id as string
      }
    }
  });
  res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
