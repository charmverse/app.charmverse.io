import { log } from '@charmverse/core/log';

import type { MixpanelEventMap, MixpanelEventName } from './interfaces';
import { mixpanel } from './mixpanel';
import type { UTMParams } from './utils';
import { eventNameToHumanFormat, paramsToHumanFormat } from './utils';

export interface MixpanelTrackBase {
  // distinct_id - property name required by mixpanel to identify unique users
  distinct_id: string;
  isAnonymous?: boolean;
}

export function trackUserAction<T extends MixpanelEventName>(
  eventName: T,
  params: MixpanelEventMap[T],
  utmParams: UTMParams = {} // these should not be modified
) {
  const { userId, ...restParams } = params;
  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    ...paramsToHumanFormat(restParams),
    // when tracking utm_params in Mixpanel event, it should also update the user profile with initial_<utm_param> properties
    // source: https://docs.mixpanel.com/docs/tracking-methods/sdks/javascript
    ...utmParams
  };

  const humanReadableEventName = eventNameToHumanFormat(eventName as string);

  try {
    mixpanel?.track(humanReadableEventName, mixpanelTrackParams);
  } catch (error) {
    log.warn(`Failed to track mixpanel event ${eventName as string}`, {
      error,
      humanReadableEventName,
      params: mixpanelTrackParams
    });
  }
}
