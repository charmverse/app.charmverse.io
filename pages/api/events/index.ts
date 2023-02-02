import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { MixpanelEventName, MixpanelEvent } from 'lib/metrics/mixpanel/interfaces';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(trackHandler);

async function trackHandler(req: NextApiRequest, res: NextApiResponse<{ success: 'ok' } | { error: string }>) {
  const { event: eventName, ...eventPayload } = req.body as MixpanelEvent & { event: string };
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

  trackUserAction(_eventName as MixpanelEventName, { ...eventPayload, userId });

  res.status(200).end();
}

export default withSessionRoute(handler);
