
import type { PaymentMethod } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<PaymentMethod>(['id'], 'query'))
  .put(updateSafe)
  .delete(deleteSafe);

async function updateSafe (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as any as PaymentMethod;

  const wallet = await prisma.userGnosisSafe.findFirst({
    where: {
      id,
      userId: req.session.user.id
    }
  });

  if (!wallet) {
    throw new DataNotFoundError(`Wallet with ID ${id} not found`);
  }

  await prisma.userGnosisSafe.update({
    where: {
      id
    },
    data: {
      name: req.body.name
    }
  });
  return res.status(200).end();
}

async function deleteSafe (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as any as PaymentMethod;

  const wallet = await prisma.userGnosisSafe.findFirst({
    where: {
      id,
      userId: req.session.user.id
    }
  });

  if (!wallet) {
    throw new DataNotFoundError(`Wallet with ID ${id} not found`);
  }

  await prisma.userGnosisSafe.delete({
    where: {
      id
    }
  });
  return res.status(200).end();
}

export default withSessionRoute(handler);
