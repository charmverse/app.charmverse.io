'use server';

import { log } from '@charmverse/core/log';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';

import { actionClient } from 'lib/actionClient';

import { eventSchema } from './trackEventActionSchema';
import { trackWaitlistMixpanelEvent } from './trackWaitlistMixpanelEvent';

export const trackEventAction = actionClient
  .metadata({ actionName: 'mixpanel_event' })
  .schema(eventSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { event: eventName, payload, ...restProps } = parsedInput;

    const userFid = ctx.session.farcasterUser?.fid ? deterministicV4UUIDFromFid(ctx.session.farcasterUser.fid) : '';

    const event = { ...payload, ...restProps, userId: userFid };

    trackWaitlistMixpanelEvent(eventName, event);

    log.debug(`Track user event: ${eventName}`, event);

    return { success: true };
  });
