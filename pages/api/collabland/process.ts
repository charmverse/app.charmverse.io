import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { task as processWebhookMessages } from 'background/tasks/processWebhookMessages';
import log from 'lib/log';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(processSqs);

async function processSqs(req: NextApiRequest, res: NextApiResponse<{ status: 'ok' }>) {
  log.info('Start processing webhook messages');
  processWebhookMessages();
  return res.status(200).json({ status: 'ok' });
}

export default withSessionRoute(handler);
