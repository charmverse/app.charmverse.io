
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership(true))
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
      isAdmin: req.body.isAdmin
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
