import { appSubdomain, isProdEnv, isStagingEnv } from 'config/constants';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';

export function getDiscordCallbackUrl(host: string | undefined) {
  const callbackUrl = `${getCallbackDomain(host)}/api/discord/callback`;

  return callbackUrl;
}

function getCallbackDomain(host: string | undefined) {
  const protocol = isProdEnv || isStagingEnv ? `https://` : `http://`;

  if (!host) {
    return `${protocol}//${appSubdomain}.${getAppApexDomain()}`;
  }

  const subdomain = getValidSubdomain(host);
  const callbackDomain = subdomain ? `${protocol}${host?.replace(subdomain, 'app')}` : `${protocol}${host}`;

  return callbackDomain;
}
