import log from 'loglevel';

import type { MixpanelEventMap, MixpanelEventName, MixpanelTrackBase } from 'lib/metrics/mixpanel/interfaces';
import { mixpanel } from 'lib/metrics/mixpanel/mixpanel';
import { eventNameToHumanFormat, paramsToHumanFormat } from 'lib/metrics/mixpanel/utils';

export function trackUserAction<T extends MixpanelEventName> (eventName: T, params: MixpanelEventMap[T]) {
  const { userId, ...restParams } = params;

  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    ...paramsToHumanFormat(restParams)
  };
  const humanReadableEventName = eventNameToHumanFormat(eventName);

  try {
    mixpanel?.track(humanReadableEventName, mixpanelTrackParams);
  }
  catch (e) {
    log.warn(`Failed to update mixpanel event ${eventName}`);
  }
}
