import type { PaymentMethod } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { DataNotFoundError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<PaymentMethod>(['id'], 'query'))
  .delete(deletePaymentMethod);

async function deletePaymentMethod(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as any as PaymentMethod;

  const paymentMethod = await prisma.paymentMethod.findUnique({
    where: {
      id
    }
  });

  if (!paymentMethod) {
    throw new DataNotFoundError(`Payment method with ID ${id} not found`);
  }

  const { error } = await hasAccessToSpace({
    userId: req.session.user.id,
    spaceId: paymentMethod.spaceId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  await prisma.paymentMethod.delete({
    where: {
      id
    }
  });
  return res.status(200).end();
}

export default withSessionRoute(handler);
