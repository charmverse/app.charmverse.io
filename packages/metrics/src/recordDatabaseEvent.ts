import { prisma } from '@charmverse/core/prisma-client';

import type { MixpanelEvent, MixpanelEventName, MixpanelTrackBase } from './mixpanel/interfaces';
import type { PageEventMap } from './mixpanel/interfaces/PageEvent';
import type { UserEventMap } from './mixpanel/interfaces/UserEvent';
import type { MixpanelOpEvent, MixpanelOpEventName } from './mixpanel/opEvents';

export type EventInput<T = MixpanelEvent> = T & {
  event: MixpanelEventName;
} & Partial<MixpanelTrackBase>;

export type OpEventInput<T = MixpanelOpEvent> = T & {
  event: MixpanelOpEventName;
} & Partial<MixpanelTrackBase>;

/*
 * This function is used to record events in the database.
 * userId? - existing user id, optional. Must be a valid user id in the database
 * distinctUserId? - a unique id for the user, can be either an anonymous user id or a user id
 */

export async function recordDatabaseEvent({
  event,
  userId,
  distinctUserId
}: {
  event: EventInput;
  userId?: string;
  distinctUserId?: string;
}) {
  if (event.event === 'app_loaded') {
    const typedEvent = event as UserEventMap['app_loaded'];

    await prisma.userSpaceAction.create({
      data: {
        action: 'app_loaded',
        createdBy: userId,
        distinctUserId,
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
          distinctUserId,
          meta: typedEvent.meta,
          pageId: typedEvent.pageId,
          postId: typedEvent.postId,
          spaceId: typedEvent.spaceId,
          pageType: typedEvent.type
        }
      });
    }
  }
}
