import type { Transaction } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createTransaction } from 'lib/transactions/createTransaction';
import type { TransactionCreationData } from 'lib/transactions/interface';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<TransactionCreationData>(['applicationId', 'transactionId', 'chainId'], 'body'))
  .post(createTransactionController);

async function createTransactionController(req: NextApiRequest, res: NextApiResponse<Transaction>) {
  const userId = req.session.user.id;
  const transaction = await createTransaction({ ...req.body, userId } as TransactionCreationData);
  return res.status(200).json(transaction);
}

export default withSessionRoute(handler);
