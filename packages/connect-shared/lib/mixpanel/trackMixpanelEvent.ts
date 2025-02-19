import { trackUserActionSimple } from '@root/lib/metrics/mixpanel/trackUserAction';

import type { EventType } from './trackEventActionSchema';

export function trackMixpanelEvent(event: EventType, params: { userId: string } & Record<string, string | boolean>) {
  trackUserActionSimple(event, params);
}
