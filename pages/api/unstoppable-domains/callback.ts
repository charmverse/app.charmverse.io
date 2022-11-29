import type { Transaction } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createTransaction } from 'lib/transactions/createTransaction';
import type { TransactionCreationData } from 'lib/transactions/interface';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(handleUnstoppableDomainsAuthController);

async function handleUnstoppableDomainsAuthController(req: NextApiRequest, res: NextApiResponse) {
  const query = req.query;

  const body = req.body;

  return res.status(200).send(JSON.stringify({ query, body }));
}

export default withSessionRoute(handler);
