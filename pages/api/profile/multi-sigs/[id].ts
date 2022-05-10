
import { PaymentMethod } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<PaymentMethod>(['id'], 'query'))
  .put(updatePaymentMethod)
  .delete(deletePaymentMethod);

async function updatePaymentMethod (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as any as PaymentMethod;

  const wallet = await prisma.userMultiSigWallet.findFirst({
    where: {
      id,
      userId: req.session.user.id
    }
  });

  if (!wallet) {
    throw new DataNotFoundError(`Wallet with ID ${id} not found`);
  }

  await prisma.userMultiSigWallet.update({
    where: {
      id
    },
    data: {
      name: req.body.name
    }
  });
  return res.status(200).end();
}

async function deletePaymentMethod (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as any as PaymentMethod;

  const wallet = await prisma.userMultiSigWallet.findFirst({
    where: {
      id,
      userId: req.session.user.id
    }
  });

  if (!wallet) {
    throw new DataNotFoundError(`Wallet with ID ${id} not found`);
  }

  await prisma.userMultiSigWallet.delete({
    where: {
      id
    }
  });
  return res.status(200).end();
}

export default withSessionRoute(handler);
