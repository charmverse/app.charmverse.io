import log from 'loglevel';

import type { MixpanelEventMap, MixpanelEventName, MixpanelTrackBase } from './interfaces';
import { mixpanel } from './mixpanel';
import { eventNameToHumanFormat, paramsToHumanFormat } from './utils';

export function trackUserAction<T extends MixpanelEventName>(eventName: T, params: MixpanelEventMap[T]) {
  const { userId, ...restParams } = params;

  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    ...paramsToHumanFormat(restParams)
  };
  const humanReadableEventName = eventNameToHumanFormat(eventName);

  try {
    mixpanel?.track(humanReadableEventName, mixpanelTrackParams);
  } catch (e) {
    log.warn(`Failed to update mixpanel event ${eventName}`);
  }
}
