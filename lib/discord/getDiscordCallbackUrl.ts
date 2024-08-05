import { getCallbackDomain } from '@root/lib/oauth/getCallbackDomain';
import type { OauthFlowType } from '@root/lib/oauth/interfaces';

const callbackPaths: Record<OauthFlowType, string> = {
  popup: '/authenticate/discord'
};

export function getDiscordCallbackUrl(host: string | undefined, authFlowType: OauthFlowType = 'popup') {
  const callbackUrl = `${getCallbackDomain(host)}${callbackPaths[authFlowType]}`;

  return callbackUrl;
}
