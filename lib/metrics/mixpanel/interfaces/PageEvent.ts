import type { BaseEvent } from 'lib/metrics/mixpanel/interfaces/BaseEvent';

export type PageEvent = BaseEvent & {
  pageId: string;
}
