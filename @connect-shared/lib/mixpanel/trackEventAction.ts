'use server';

import { trackUserAction } from '@root/lib/metrics/mixpanel/trackUserAction';
import { v4 as uuid } from 'uuid';

import { actionClient } from '../actions/actionClient';

import { schema } from './trackEventActionSchema';

export const trackEventAction = actionClient
  .metadata({ actionName: 'mixpanel_event' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const { event: eventName, ...eventPayload } = parsedInput;

    const sessionUserId = ctx.session.user?.id;
    const userId: string | undefined = sessionUserId;

    // TODO: Handle anonymous user ids
    if (!ctx.session.anonymousUserId) {
      ctx.session.anonymousUserId = uuid();
      await ctx.session.save();
    }

    const event = { userId, ...eventPayload };

    // Make sure to use userId from session
    event.userId = sessionUserId;
    if (userId === ctx.session.anonymousUserId) {
      event.isAnonymous = true;
    }

    trackUserAction(eventName, event);

    // try {
    //   await recordDatabaseEvent({
    //     event,
    //     distinctUserId: event.userId,
    //     userId: sessionUserId
    //   });
    // } catch (error) {
    //   log.error('Error recording database event', { ...parsedInput, error });
    // }

    return { success: true };
  });
