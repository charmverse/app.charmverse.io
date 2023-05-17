import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { MixpanelEventName, MixpanelEvent, MixpanelTrackBase } from 'lib/metrics/mixpanel/interfaces';
import type { ForumEventMap } from 'lib/metrics/mixpanel/interfaces/ForumEvent';
import type { PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

export type EventInput<T = MixpanelEvent> = T & {
  event: MixpanelEventName;
} & Partial<MixpanelTrackBase>;

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(trackHandler);

async function trackHandler(req: NextApiRequest, res: NextApiResponse<{ success: 'ok' } | { error: string }>) {
  const request = req.body as EventInput;

  const { event: eventName, ...eventPayload } = request;

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
    await recordDatabaseEvent(req.body, userId);
  } catch (error) {
    log.error('Error recording database event', { ...request, error });
  }

  res.status(200).end();
}

async function recordDatabaseEvent(event: EventInput, userId?: string) {
  if (event.event === 'page_view') {
    const typedEvent = event as PageEventMap['page_view'];
    // ignore non-document pages (bounties list or forum feed page, etc)
    if (typedEvent.spaceId) {
      await prisma.userSpaceAction.create({
        data: {
          action: 'view_page',
          createdBy: userId,
          pageId: typedEvent.pageId,
          spaceId: typedEvent.spaceId!,
          pageType: typedEvent.type
        }
      });
    }
  }
  if (event.event === 'load_post_page') {
    const typedEvent = event as ForumEventMap['load_post_page'];
    await prisma.userSpaceAction.create({
      data: {
        action: 'view_page',
        createdBy: userId,
        postId: typedEvent.resourceId,
        spaceId: typedEvent.spaceId,
        pageType: 'post'
      }
    });
  }
}
export default withSessionRoute(handler);
