import { log } from '@charmverse/core/log';
import { trackUserActionSimple } from '@root/lib/metrics/mixpanel/trackUserAction';

import type { WaitlistEvent, WaitlistEventMap } from './trackEventActionSchema';

export function trackWaitlistMixpanelEvent<T extends WaitlistEvent = WaitlistEvent>(
  event: T,
  params: WaitlistEventMap[T]
) {
  try {
    trackUserActionSimple(event, { ...params, userId: (params as { userId?: string }).userId || '' });
  } catch (error) {
    log.error('Failed to track waitlist mixpanel event', { event, params, error });
  }
}
