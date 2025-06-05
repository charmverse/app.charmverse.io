import { log } from '@charmverse/core/log';
import * as http from '@packages/adapters/http';
import type { MixpanelEventMap, MixpanelEventName } from '@packages/metrics/mixpanel/interfaces';
import type { MixpanelOpEventMap, MixpanelOpEventName } from '@packages/metrics/mixpanel/opEvents';

export class TrackApi {
  private lastEvent: { payload: string; timestamp: number } | null = null;

  private lastOpEvent: { payload: string; timestamp: number } | null = null;

  trackAction<T extends MixpanelEventName>(event: T, payload: Omit<MixpanelEventMap[T], 'userId'>) {
    const payloadAsString = event + JSON.stringify(payload);
    const now = Date.now();

    // Ignore identical events within 1 second of each other
    // This also stops sending duplicate events when the user clicks multiple times on a page in the sidebar
    if (this.lastEvent && this.lastEvent.payload === payloadAsString && now - this.lastEvent.timestamp < 1000) {
      this.lastEvent = {
        payload: payloadAsString,
        timestamp: now
      };

      if (process.env.NODE_ENV === 'development') {
        log.warn(
          'Dropping duplicate track event because it occurred less than 1 second after the previous event, which was identical'
        );
      }

      return Promise.resolve({ success: 'ignored' });
    }

    this.lastEvent = {
      payload: payloadAsString,
      timestamp: now
    };

    return http.POST(`/api/events`, { event, ...payload });
  }

  trackActionOp<T extends MixpanelOpEventName>(event: T, payload: Omit<MixpanelOpEventMap[T], 'userId'>) {
    const payloadAsString = event + JSON.stringify(payload);
    const now = Date.now();

    // Ignore identical events within 1 second of each other
    // This also stops sending duplicate events when the user clicks multiple times on a page in the sidebar
    if (this.lastOpEvent && this.lastOpEvent.payload === payloadAsString && now - this.lastOpEvent.timestamp < 1000) {
      this.lastOpEvent = {
        payload: payloadAsString,
        timestamp: now
      };

      if (process.env.NODE_ENV === 'development') {
        log.warn(
          'Dropping duplicate track event because it occurred less than 1 second after the previous event, which was identical'
        );
      }

      return Promise.resolve({ success: 'ignored' });
    }

    this.lastOpEvent = {
      payload: payloadAsString,
      timestamp: now
    };

    return http.POST(`/api/events/op`, { event, ...payload });
  }
}
