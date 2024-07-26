import { log } from '@charmverse/core/log';
import { v4 as uuid } from 'uuid';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { recordDatabaseEvent, type EventInput } from 'lib/metrics/recordDatabaseEvent';
import { InvalidInputError } from 'lib/utils/errors';

import { getSession } from '../lib/session/getSession';

export async function trackMixPanelEvent(req: Request) {
  const request = (await req.json()) as EventInput;

  const { event: eventName, ...eventPayload } = request;

  if (typeof eventName !== 'string') {
    throw new InvalidInputError(`Invalid eventName: ${eventName}`);
  }

  const session = await getSession();
  const sessionUserId = session.user?.id;

  // TODO: Handle anonymous user ids
  // if (!req.session.anonymousUserId) {
  //   req.session.anonymousUserId = uuid();
  //   await req.session.save();
  // }

  // // Make sure to use userId from session
  // eventPayload.userId = sessionUserId;
  // if (eventPayload.userId === req.session.anonymousUserId) {
  //   eventPayload.isAnonymous = true;
  // }

  if (!eventPayload.userId) {
    throw new InvalidInputError('Invalid track data');
  }

  trackUserAction(eventName, eventPayload);

  try {
    await recordDatabaseEvent({
      event: request,
      distinctUserId: eventPayload.userId,
      userId: sessionUserId
    });
  } catch (error) {
    log.error('Error recording database event', { ...request, error });
  }

  return Response.json({ success: true });
}
