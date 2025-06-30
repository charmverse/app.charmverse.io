import { log } from '@packages/core/log';

import type { MixpanelTrackBase } from './interfaces';
import { mixpanelOp } from './mixpanel';
import type { MixpanelOpEventMap, MixpanelOpEventName } from './opEvents';
import { eventNameToHumanFormat, paramsToHumanFormat, validateMixPanelEvent } from './utils';

export function trackOpUserAction<T extends MixpanelOpEventName>(eventName: T, params: MixpanelOpEventMap[T]) {
  const { userId, ...restParams } = params;
  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    ...paramsToHumanFormat(restParams)
  };

  const humanReadableEventName = eventNameToHumanFormat(eventName);

  const validEvent = validateMixPanelEvent(mixpanelTrackParams);
  if (!validEvent) {
    log.warn(`Failed to send op event ${eventName}`, { userId, params });
    return;
  }

  try {
    mixpanelOp?.track(humanReadableEventName, mixpanelTrackParams);
  } catch (e) {
    log.warn(`Failed to update mixpanel op event ${eventName}`);
  }
}
