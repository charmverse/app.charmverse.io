import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { CreateEventPayload } from 'lib/notifications/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishCardEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createEvent);

async function createEvent(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  const { id: spaceId } = req.query as { id: string };
  const events = req.body as CreateEventPayload[];

  for (const event of events) {
    switch (event.scope) {
      case WebhookEventNames.CardPersonPropertyAssigned: {
        await publishCardEvent({
          ...event,
          spaceId,
          userId
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  return res.status(201);
}

export default withSessionRoute(handler);
