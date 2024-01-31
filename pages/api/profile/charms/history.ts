import type { CharmTransaction } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { listTransactionsHistory } from 'lib/charms/listTransactionsHistory';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getCharmsHistoryHandler);

async function getCharmsHistoryHandler(req: NextApiRequest, res: NextApiResponse<CharmTransaction[]>) {
  const userId = req.session.user.id;
  const page = Math.abs(parseInt(req.query.page as string));
  const pageSize = parseInt(req.query.pageSize as string);

  const txs = await listTransactionsHistory({
    userId,
    page,
    pageSize: Number.isNaN(pageSize) || pageSize <= 0 ? undefined : pageSize
  });

  res.status(200).json(txs);
}

export default withSessionRoute(handler);
