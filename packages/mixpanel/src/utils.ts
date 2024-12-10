import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { ReferralPlatform } from '@charmverse/core/prisma';
import { isProdEnv } from '@packages/utils/constants';
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

export function getUTMParamsFromSearch(searchString: string): UTMParams | undefined {
  const urlParams = new URLSearchParams(searchString);
  const utmParams: UTMParams = {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined
  };
  if (Object.values(utmParams).every((value) => value === undefined)) {
    return undefined;
  }
  return {
    utm_from: new Date().toLocaleDateString(), // so we know when these were created
    ...utmParams
  };
}

const platform = env('SCOUTGAME_PLATFORM') || process.env.REACT_APP_SCOUTGAME_PLATFORM || 'webapp';

function isPlatform(_platform: string = ''): _platform is ReferralPlatform {
  const availablePlatforms = Object.values(ReferralPlatform);

  return availablePlatforms.includes(_platform as ReferralPlatform);
}

export function getPlatform(): ReferralPlatform {
  if (isPlatform(platform)) {
    return platform;
  }

  if (platform || isProdEnv) {
    log.warn(`Unknown value for REACT_APP_SCOUTGAME_PLATFORM: ${platform}`);
  }

  return 'unknown';
}
