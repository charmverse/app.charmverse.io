import { capitalize } from 'lodash';

import type { MixpanelEventName } from 'lib/metrics/mixpanel/interfaces';

// format event_name to Event name
export function eventNameToHumanFormat (eventName: MixpanelEventName) {
  return capitalize(eventName.toLowerCase().replaceAll('_', ' '));
}

export function paramToHumanFormat (param: string) {
  const paramSpaces = param.replace(/[A-Z]/g, l => ` ${l}`).trim();
  return paramSpaces.charAt(0).toUpperCase() + paramSpaces.slice(1);
}

export function paramsToHumanFormat (params: Record<string, any>) {
  const humanReadableParams: Record<string, any> = {};

  Object.keys(params).forEach(k => {
    const updatedKey = paramToHumanFormat(k);
    humanReadableParams[updatedKey] = params[k];
  });

  return humanReadableParams;
}

