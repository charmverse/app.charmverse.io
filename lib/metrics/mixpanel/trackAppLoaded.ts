import { log } from '@charmverse/core/log';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { recordDatabaseEvent } from 'lib/metrics/recordDatabaseEvent';

export async function trackAppLoaded(userId: string, spaceId?: string) {
  const eventPayload = {
    userId,
    spaceId
  };

  trackUserAction('app_loaded', eventPayload);

  try {
    await recordDatabaseEvent({ event: 'app_loaded', ...eventPayload });
  } catch (error) {
    log.error('Error recording database event', { event: 'app_loaded', ...eventPayload });
  }
}
