
import { Transaction } from '@prisma/client';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createTransaction } from 'lib/transactions/createTransaction';
import { TransactionCreationData } from 'lib/transactions/interface';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).use(requireKeys<TransactionCreationData>(['applicationId', 'transactionId', 'chainId'], 'body')).post(createTransactionController);

async function createTransactionController (req: NextApiRequest, res: NextApiResponse<Transaction>) {
  const transaction = await createTransaction(req.body as TransactionCreationData);
  return res.status(200).json(transaction);
}

export default withSessionRoute(handler);
