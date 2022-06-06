
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(checkPathExists);

export async function checkPathExists (req: NextApiRequest, res: NextApiResponse<{ available: boolean}>) {
  const path = req.query.path as string;
  const existing = await prisma.user.findUnique({
    where: {
      path
    },
    select: { id: true }
  });

  const ownedByMe = existing?.id === req.session.user.id;

  res.status(200).json({ available: !existing || ownedByMe });
}

export default withSessionRoute(handler);
