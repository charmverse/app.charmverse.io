import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 as uuid } from 'uuid';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { recordDatabaseEvent, type EventInput } from 'lib/metrics/recordDatabaseEvent';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(trackHandler);

async function trackHandler(req: NextApiRequest, res: NextApiResponse<{ success: 'ok' } | { error: string }>) {
  const request = req.body as EventInput;

  const { event: eventName, ...eventPayload } = request;

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

  // backwards compatibility - can delete after December 14
  const _eventName = eventName ?? req.query.event;

  if (!userId || !_eventName) {
    throw new InvalidInputError('Invalid track data');
  }

  trackUserAction(_eventName, { ...eventPayload, userId });

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
