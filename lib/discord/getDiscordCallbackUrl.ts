import { appSubdomain, isProdEnv, isStagingEnv } from 'config/constants';
import type { OauthFlowType } from 'lib/oauth/interfaces';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';
import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';
import { getAppOriginURL } from 'lib/utilities/getAppOriginURL';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';

const callbackPaths: Record<OauthFlowType, string> = {
  page: '/api/discord/callback',
  popup: '/authenticate/discord'
};

export function getDiscordCallbackUrl(host: string | undefined, authFlowType: OauthFlowType = 'page') {
  const callbackUrl = `${getCallbackDomain(host)}${callbackPaths[authFlowType]}`;

  return callbackUrl;
}

function getCallbackDomain(host: string | undefined) {
  const protocol = isProdEnv || isStagingEnv ? `https://` : `http://`;

  if (!host) {
    return `${protocol}//${appSubdomain}.${getAppApexDomain()}`;
  }

  if (getValidCustomDomain(host)) {
    return getAppOriginURL({ protocol, host }).toString().replace(/\/$/, '');
  }

  const subdomain = getValidSubdomain(host);
  const callbackDomain = subdomain ? `${protocol}${host?.replace(subdomain, 'app')}` : `${protocol}${host}`;

  return callbackDomain;
}
