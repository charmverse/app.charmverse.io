
import { PaymentMethod } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<PaymentMethod>(['id'], 'query'))
  .delete(deletePaymentMethod);

async function deletePaymentMethod (req: NextApiRequest, res: NextApiResponse) {

  const { id } = req.query as any as PaymentMethod;

  await prisma.paymentMethod.delete({
    where: {
      id
    }
  });
  return res.status(200).json({});
}

export default withSessionRoute(handler);
