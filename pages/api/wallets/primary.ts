import type { UserWallet } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getPrimaryWalletController)
  .use(requireKeys(['walletId']))
  .put(setPrimaryWalletController);

async function getPrimaryWalletController(req: NextApiRequest, res: NextApiResponse<UserWallet | null>) {
  const userId = req.session.user.id;

  const primaryWallet = await prisma.userWallet.findFirst({
    where: {
      userId,
      primary: true
    }
  });

  return res.status(200).json(primaryWallet);
}

async function setPrimaryWalletController(req: NextApiRequest, res: NextApiResponse<UserWallet | null>) {
  const userId = req.session.user.id;
  const { walletId } = req.body as {
    walletId: string;
  };

  const updatedWallet = await prisma.userWallet.update({
    where: {
      id: walletId,
      userId
    },
    data: {
      primary: true
    }
  });

  if (updatedWallet) {
    await prisma.userWallet.updateMany({
      where: {
        id: {
          not: walletId
        },
        userId
      },
      data: {
        primary: false
      }
    });
  }

  return res.status(200).json(updatedWallet);
}

export default withSessionRoute(handler);
