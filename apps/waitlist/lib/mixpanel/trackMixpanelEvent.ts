import { trackUserActionSimple } from '@root/lib/metrics/mixpanel/trackUserAction';

import type { WaitlistEvent, WaitlistEventMap } from './trackEventActionSchema';

export function trackWaitlistMixpanelEvent<T extends WaitlistEvent = WaitlistEvent>(
  event: T,
  params: WaitlistEventMap[T]
) {
  trackUserActionSimple(event, { ...params, userId: (params as { userId?: string }).userId || '' });
}
