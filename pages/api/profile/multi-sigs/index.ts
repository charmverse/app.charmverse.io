
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
  .post(create);

async function list (req: NextApiRequest, res: NextApiResponse<UserMultiSigWallet[]>) {

  const wallets = await prisma.userMultiSigWallet.findMany({
    where: {
      userId: req.session.user.id
    }
  });
  return res.status(200).json(wallets);
}

async function create (req: NextApiRequest, res: NextApiResponse<UserMultiSigWallet>) {

  const walletsInput = req.body.map((wallet: any) => ({
    userId: req.session.user.id,
    walletType: 'gnosis',
    ...wallet
  }));
  console.log(walletsInput);

  const [, wallets] = await prisma.$transaction([
    prisma.userMultiSigWallet.deleteMany({
      where: {
        userId: req.session.user.id
      }
    }),
    prisma.userMultiSigWallet.createMany({
      data: walletsInput
    })
  ]);

  return res.status(200).json(wallets);
}

export default withSessionRoute(handler);
