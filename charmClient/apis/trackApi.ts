
import * as http from 'adapters/http';
import type { MixpanelEventMap, MixpanelEventName } from 'lib/metrics/mixpanel/interfaces';

export class TrackApi {

  private lastEvent: { payload: string, timestamp: number } | null = null;

  trackAction<T extends MixpanelEventName> (event: T, payload: Omit<MixpanelEventMap[T], 'userId'>) {

    const payloadAsString = JSON.stringify(payload);
    const now = Date.now();

    // Ignore identical events within 1 second of each other
    // This also stops sending duplicate events when the user clicks multiple times on a page in the sidebar
    if (this.lastEvent && this.lastEvent.payload === payloadAsString && now - this.lastEvent.timestamp < 1000) {
      this.lastEvent = {
        payload: payloadAsString,
        timestamp: now
      };
      return Promise.resolve({ success: 'ignored' });
    }

    this.lastEvent = {
      payload: payloadAsString,
      timestamp: now
    };

    return http.POST<{ success: 'ok' | 'ignored' }>(`/api/events?event=${event}`, payload);
  }
}

