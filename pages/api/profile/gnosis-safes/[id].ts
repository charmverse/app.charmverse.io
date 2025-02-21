import type { PaymentMethod } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<PaymentMethod>(['id'], 'query'))
  .put(updateSafe)
  .delete(deleteSafe);

async function updateSafe(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as any as PaymentMethod;
  const { name, isHidden } = req.body;
  const userId = req.session.user.id;

  const wallet = await prisma.userGnosisSafe.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!wallet) {
    throw new DataNotFoundError(`Wallet with ID ${id} not found`);
  }

  await prisma.userGnosisSafe.update({
    where: {
      id,
      userId
    },
    data: {
      name,
      isHidden
    }
  });
  return res.status(200).end();
}

async function deleteSafe(req: NextApiRequest, res: NextApiResponse) {
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
