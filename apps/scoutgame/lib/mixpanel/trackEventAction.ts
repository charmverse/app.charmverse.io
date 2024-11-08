'use server';

import { log } from '@charmverse/core/log';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { v4 as uuid } from 'uuid';

import { actionClient } from '../actions/actionClient';

import { eventSchema } from './trackEventActionSchema';

export const trackEventAction = actionClient
  .metadata({ actionName: 'mixpanel_event' })
  .schema(eventSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { event: eventName, ...eventPayload } = parsedInput;

    let sessionUserId = ctx.session.user?.id || ctx.session.scoutId;
    const userId = sessionUserId || '';

    // TODO: Handle anonymous user ids
    if (!ctx.session.anonymousUserId) {
      ctx.session.anonymousUserId = uuid();
      sessionUserId = ctx.session.anonymousUserId;
      await ctx.session.save();
    }

    const event = { userId, ...eventPayload };

    // Make sure to use userId from session
    event.userId = sessionUserId || '';
    if (userId === ctx.session.anonymousUserId) {
      event.isAnonymous = true;
    }

    trackUserAction(eventName, event);

    log.debug(`Track user event: ${eventName}`, { userId: event.userId, path: event.currentUrlPath });

    return { success: true };
  });
