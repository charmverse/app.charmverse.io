
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

export interface UpdateGnosisSafeState {
  snoozeMessage: string | null
  snoozeFor: Date | null
}

handler
  .use(requireUser)
  .use(requireKeys(['snoozeFor', 'snoozeMessage'], 'body'))
  .put(updateGnosisSafeState);

async function updateGnosisSafeState (req: NextApiRequest, res: NextApiResponse<{ ok: true }>) {
  const { snoozeFor, snoozeMessage } = req.body as UpdateGnosisSafeState;
  await prisma.userGnosisSafeState.upsert({
    where: {
      userId: req.session.user.id
    },
    update: {
      transactionsSnoozedFor: snoozeFor,
      transactionsSnoozeMessage: snoozeMessage
    },
    create: {
      transactionsSnoozedFor: snoozeFor,
      transactionsSnoozeMessage: snoozeMessage,
      user: {
        connect: {
          id: req.session.user.id
        }
      }
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
