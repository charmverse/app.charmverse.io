import { trackUserActionOp } from '@root/lib/metrics/mixpanel/trackUserActionOp';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 as uuid } from 'uuid';

import type { OpEventInput } from 'lib/metrics/recordDatabaseEvent';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(trackHandler);

async function trackHandler(req: NextApiRequest, res: NextApiResponse<{ success: 'ok' } | { error: string }>) {
  const request = req.body as OpEventInput;

  const { event: eventName, ...eventPayload } = request;

  if (typeof eventName !== 'string') {
    throw new InvalidInputError(`Invalid eventName: ${eventName}`);
  }

  if (!req.session.anonymousUserId) {
    req.session.anonymousUserId = uuid();
    await req.session.save();
  }

  const userId = req.session.user?.id ?? req.session.anonymousUserId;
  // Make sure to use userId from session
  eventPayload.userId = userId;
  if (eventPayload.userId === req.session.anonymousUserId) {
    eventPayload.isAnonymous = true;
  }

  if (!userId) {
    throw new InvalidInputError('Invalid track data');
  }

  trackUserActionOp(eventName, { ...eventPayload, userId });

  res.status(200).end();
}

export default withSessionRoute(handler);
