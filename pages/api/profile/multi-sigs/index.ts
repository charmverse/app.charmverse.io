
import { UserMultiSigWallet } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(list)
  .use(requireKeys<UserMultiSigWallet>(['chainId', 'address'], 'body'))
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

  const {
    chainId,
    address
  } = req.body as UserMultiSigWallet;

  const wallet = await prisma.userMultiSigWallet.create({
    data: {
      address,
      chainId,
      createdBy: req.session.user.id,
      walletType: 'gnosis',
      user: {
        connect: {
          id: req.session.user.id
        }
      }
    }
  });

  return res.status(200).json(wallet);
}

export default withSessionRoute(handler);
