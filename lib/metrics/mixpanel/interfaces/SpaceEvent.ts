import type { BaseEvent } from 'lib/metrics/mixpanel/interfaces/BaseEvent';

export interface SpaceEvent extends BaseEvent {
  spaceId: string;
  spaceName?: string;
}
