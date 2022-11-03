
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(isConnectableWallet);

async function isConnectableWallet (req: NextApiRequest, res: NextApiResponse<{ connectable: boolean }>) {

  const { address } = req.body;

  const existingWallet = await prisma.userWallet.findUnique({
    where: {
      address
    }
  });

  if (!existingWallet) {
    return res.status(200).json({ connectable: true });
  }

  return res.status(200).json({ connectable: false });

}

export default withSessionRoute(handler);

