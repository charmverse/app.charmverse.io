import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(disconnectDiscord);

async function disconnectDiscord (req: NextApiRequest, res: NextApiResponse) {
  const user = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    }
  });

  if (user?.addresses.length === 0) {
    return res.status(400).json({
      error: 'You must have at least a single address'
    });
  }
  await prisma.discordUser.delete({
    where: {
      userId: req.session.user.id
    }
  });

  res.status(200).json({ success: 'ok' });
}

export default withSessionRoute(handler);
