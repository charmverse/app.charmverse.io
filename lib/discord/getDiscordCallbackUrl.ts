import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';
import type { OauthFlowType } from 'lib/oauth/interfaces';

const callbackPaths: Record<OauthFlowType, string> = {
  page: '/api/discord/callback',
  popup: '/authenticate/discord'
};

export function getDiscordCallbackUrl(host: string | undefined, authFlowType: OauthFlowType = 'page') {
  const callbackUrl = `${getCallbackDomain(host)}${callbackPaths[authFlowType]}`;

  return callbackUrl;
}
