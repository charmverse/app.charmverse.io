import { log } from '@charmverse/core/log';

import type { MixpanelEventMap, MixpanelEventName, MixpanelTrackBase } from './interfaces';
import { mixpanel } from './mixpanel';
import { eventNameToHumanFormat, paramsToHumanFormat, validateMixPanelEvent } from './utils';

export function trackUserAction<T extends MixpanelEventName>(eventName: T, params: MixpanelEventMap[T]) {
  const { userId, ...restParams } = params;
  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    ...paramsToHumanFormat(restParams)
  };

  const validEvent = validateMixPanelEvent(mixpanelTrackParams);
  if (!validEvent) {
    log.warn(`Mixpanel event is invalid: ${eventName}`, { userId, params: mixpanelTrackParams });
    return;
  }

  return trackUserActionSimple(eventName, params);
}

// a simpler method that is un-opinionated about types or event schema
export function trackUserActionSimple<T extends string = string>(eventName: T, params: { userId: string } & object) {
  const { userId, ...restParams } = params;
  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    ...paramsToHumanFormat(restParams)
  };

  const humanReadableEventName = eventNameToHumanFormat(eventName);

  try {
    mixpanel?.track(humanReadableEventName, mixpanelTrackParams);
  } catch (error) {
    log.warn(`Failed to update mixpanel event ${eventName}`, { error });
  }
}
