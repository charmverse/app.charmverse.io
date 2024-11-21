import { capitalize } from '@packages/utils/strings';

export function eventNameToHumanFormat(eventName: string) {
  return capitalize(eventName.toLowerCase().replaceAll('_', ' '));
}

export function stringToHumanFormat(str: string) {
  const stringWithSpaces = str.replace(/[A-Z]/g, (l) => ` ${l}`).trim();
  return stringWithSpaces.charAt(0).toUpperCase() + stringWithSpaces.slice(1);
}

export function paramsToHumanFormat(params: Record<string, any>) {
  const humanReadableParams: Record<string, any> = {};

  Object.keys(params).forEach((k) => {
    const updatedKey = stringToHumanFormat(k);
    humanReadableParams[updatedKey] = params[k];
  });

  return humanReadableParams;
}

// searchString is the search part of the URL, starting with ?
export type UTMParams = Record<string, string | undefined>;

export function getUTMParamsFromSearch(searchString: string): UTMParams {
  const urlParams = new URLSearchParams(searchString);
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined
  };
}
