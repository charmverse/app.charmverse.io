'use server';

import { log } from '@charmverse/core/log';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { getUTMParamsFromSearch } from '@packages/mixpanel/utils';
import { v4 as uuid } from 'uuid';

import { actionClient } from '../actions/actionClient';

import { eventSchema } from './trackEventActionSchema';

export const trackEventAction = actionClient
  .metadata({ actionName: 'mixpanel_event' })
  .schema(eventSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { event: eventName, ...eventPayload } = parsedInput;

    let userId = ctx.session.scoutId || ctx.session.anonymousUserId;

    const utmParams = getUTMParamsFromSearch(eventPayload.currentUrlSearch || '');
    if (utmParams) {
      // store the utm params in the session so we can use them in future events
      ctx.session.utmParams = utmParams;
      await ctx.session.save();
    }

    if (!userId) {
      ctx.session.anonymousUserId = uuid();
      userId = ctx.session.anonymousUserId;
      await ctx.session.save();
    }

    const event = { userId, ...eventPayload };

    if (userId === ctx.session.anonymousUserId) {
      event.isAnonymous = true;
    }

    trackUserAction(eventName, event, ctx.session.utmParams);

    log.debug(`Track user event: ${eventName}`, { userId: event.userId, path: event.currentUrlPath, utmParams });

    return { success: true };
  });
