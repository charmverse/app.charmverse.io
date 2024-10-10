import { log } from '@charmverse/core/log';

import type { MixpanelEventMap, MixpanelEventName } from './interfaces';
import { mixpanel } from './mixpanel';
import { eventNameToHumanFormat, paramsToHumanFormat } from './utils';

export interface MixpanelTrackBase {
  // distinct_id - property name required by mixpanel to identify unique users
  distinct_id: string;
  isAnonymous?: boolean;
}

// a simpler method that is un-opinionated about types or event schema
export function trackUserAction<T extends MixpanelEventName>(eventName: T, params: MixpanelEventMap[T]) {
  const { userId, ...restParams } = params;
  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    ...paramsToHumanFormat(restParams)
  };

  const humanReadableEventName = eventNameToHumanFormat(eventName as string);

  try {
    mixpanel?.track(humanReadableEventName, mixpanelTrackParams);
  } catch (error) {
    log.warn(`Failed to update mixpanel event ${eventName as string}`, { error });
  }
}
