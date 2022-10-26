
import * as http from 'adapters/http';
import type { MixpanelEventMap, MixpanelEventName } from 'lib/metrics/mixpanel/interfaces';

export class TrackApi {
  trackAction<T extends MixpanelEventName> (event: T, payload: Omit<MixpanelEventMap[T], 'userId'>) {
    return http.POST<{ success: 'ok' }>(`/api/events?event=${event}`, payload);
  }
}

