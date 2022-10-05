import type { ResourceEvent, SpaceEvent } from 'lib/metrics/mixpanel/interfaces';

export interface PageEvents {
  page_load: SpaceEvent & ResourceEvent;
}
