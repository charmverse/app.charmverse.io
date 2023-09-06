import { prisma } from '@charmverse/core/prisma-client';

import type { MixpanelEvent, MixpanelEventName, MixpanelTrackBase } from 'lib/metrics/mixpanel/interfaces';
import type { ForumEventMap } from 'lib/metrics/mixpanel/interfaces/ForumEvent';
import type { PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import type { UserEventMap } from 'lib/metrics/mixpanel/interfaces/UserEvent';

export type EventInput<T = MixpanelEvent> = T & {
  event: MixpanelEventName;
} & Partial<MixpanelTrackBase>;

export async function recordDatabaseEvent(event: EventInput, userId?: string) {
  if (event.event === 'app_loaded') {
    const typedEvent = event as UserEventMap['app_loaded'];

    await prisma.userSpaceAction.create({
      data: {
        action: 'app_loaded',
        createdBy: userId,
        spaceId: typedEvent.spaceId
      }
    });
  }

  if (event.event === 'page_view') {
    const typedEvent = event as PageEventMap['page_view'];
    // ignore non-document pages (bounties list or forum feed page, etc)
    if (typedEvent.spaceId) {
      await prisma.userSpaceAction.create({
        data: {
          action: 'view_page',
          createdBy: userId,
          pageId: typedEvent.pageId,
          spaceId: typedEvent.spaceId,
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
