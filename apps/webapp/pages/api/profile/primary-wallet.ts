import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['walletId']))
  .put(setPrimaryWalletController);

async function setPrimaryWalletController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  const { walletId } = req.body as {
    walletId: string;
  };

  await prisma.userWallet.findUniqueOrThrow({
    where: {
      id: walletId,
      userId
    }
  });

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      primaryWalletId: walletId
    }
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
