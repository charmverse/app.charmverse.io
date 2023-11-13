import { log } from '@charmverse/core/log';

import { isUUID } from 'lib/utilities/strings';

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

  const humanReadableEventName = eventNameToHumanFormat(eventName);

  const validEvent = validateMixPanelEvent(mixpanelTrackParams);
  if (!validEvent) {
    log.warn(`Failed to send event ${eventName}`, { userId, params });
    return;
  }

  try {
    mixpanel?.track(humanReadableEventName, mixpanelTrackParams);
  } catch (e) {
    log.warn(`Failed to update mixpanel event ${eventName}`);
  }
}
