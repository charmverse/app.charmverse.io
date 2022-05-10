
import { UserMultiSigWallet } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(list)
  .post(setWallets);

async function list (req: NextApiRequest, res: NextApiResponse<UserMultiSigWallet[]>) {

  const wallets = await prisma.userMultiSigWallet.findMany({
    where: {
      userId: req.session.user.id
    }
  });
  return res.status(200).json(wallets);
}

async function setWallets (req: NextApiRequest, res: NextApiResponse<UserMultiSigWallet>) {

  const walletsInput = req.body as (Pick<UserMultiSigWallet, 'address' | 'chainId' | 'name'>)[];
  const walletsData = walletsInput.map(wallet => ({
    ...wallet,
    userId: req.session.user.id,
    walletType: 'gnosis' as const
  }));

  await prisma.$transaction([
    prisma.userMultiSigWallet.deleteMany({
      where: {
        userId: req.session.user.id
      }
    }),
    prisma.userMultiSigWallet.createMany({
      data: walletsData
    })
  ]);

  return res.status(200).end();
}

export default withSessionRoute(handler);
