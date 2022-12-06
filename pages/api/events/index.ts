import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { MixpanelEventMap, MixpanelEventName } from 'lib/metrics/mixpanel/interfaces';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(trackHandler);

async function trackHandler(req: NextApiRequest, res: NextApiResponse<{ success: 'ok' } | { error: string }>) {
  const eventName = req.query.event as MixpanelEventName;
  const eventPayload: MixpanelEventMap[typeof eventName] = req.body ? { ...req.body } : {};
  const userId = req.session.user?.id ?? req.session.anonymousUserId;
  // Make sure to use userId from session
  eventPayload.userId = userId;

  if (!userId || !eventName) {
    throw new InvalidInputError('Invalid track data.');
  }

  trackUserAction(eventName, { ...eventPayload, userId });

  res.status(200).json({ success: 'ok' });
}

export default withSessionRoute(handler);
