import { log } from '@packages/core/log';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { recordDatabaseEvent, type EventInput } from '@packages/metrics/recordDatabaseEvent';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 as uuid } from 'uuid';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(trackHandler);

async function trackHandler(req: NextApiRequest, res: NextApiResponse<{ success: 'ok' } | { error: string }>) {
  const request = req.body as EventInput;

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

  trackUserAction(eventName, { ...eventPayload, userId });

  try {
    await recordDatabaseEvent({
      event: req.body,
      distinctUserId: req.session.user?.id || req.session.anonymousUserId,
      userId: req.session.user?.id
    });
  } catch (error) {
    log.error('Error recording database event', { ...request, error, referer: req.headers.referer });
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
