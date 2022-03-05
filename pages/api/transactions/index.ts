
import { Transaction, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createTransaction);

async function createTransaction (req: NextApiRequest, res: NextApiResponse<Transaction>) {
  const data = req.body as Transaction;
  const transactionToCreate = { ...data } as any;

  if (data.bountyId) {
    (transactionToCreate as Prisma.TransactionCreateInput).bounty = { connect: { id: data.bountyId } };

    // Remove bountyId passed from client to ensure Prisma doesn't throw an error
    delete transactionToCreate.bountyId;
  }

  const transaction = await prisma.transaction.create({ data: transactionToCreate });

  return res.status(200).json(transaction);
}

export default withSessionRoute(handler);
