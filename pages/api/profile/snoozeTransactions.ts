
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

export interface SnoozeTransactionsPayload {
  snooze: boolean
  snoozeFor: Date | null
}

handler
  .use(requireUser)
  .use(requireKeys(['snooze', 'snoozeFor'], 'body'))
  .put(snoozeTransactions);

async function snoozeTransactions (req: NextApiRequest, res: NextApiResponse<{ ok: true }>) {
  const { snooze, snoozeFor } = req.body as SnoozeTransactionsPayload;
  await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: {
      transactionsSnoozed: snooze,
      transactionsSnoozedFor: snoozeFor
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
