import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { MixpanelEventMap, MixpanelEventName } from 'lib/metrics/mixpanel/interfaces';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getUserProfile } from 'lib/users/getUser';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(trackHandler);

async function trackHandler (req: NextApiRequest, res: NextApiResponse<{ success: 'ok' } | { error: string }>) {
  const eventName = req.query.event as MixpanelEventName;
  const eventPayload: MixpanelEventMap[typeof eventName] = req.body ? { ...req.body } : {};
  const { id: userId } = req.session.user;
  // Make sure to use userId from session
  eventPayload.userId = userId;

  if (!userId || !eventName) {
    throw new InvalidInputError('Invalid track data.');
  }

  if ('spaceId' in eventPayload) {
    // Make sure user belongs to spaceId
    const user = await getUserProfile('id', userId);
    const hasSpace = !!user.spaceRoles.find(sr => sr.spaceId === eventPayload.spaceId);
    if (!hasSpace) {
      throw new InvalidInputError('Trying to track action of invalid workspace.');
    }
  }

  trackUserAction(eventName, eventPayload);

  res.status(200).json({ success: 'ok' });
}

export default withSessionRoute(handler);
