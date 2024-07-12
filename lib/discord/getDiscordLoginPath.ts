import type { AuthType, OauthFlowType } from '@root/lib/oauth/interfaces';

export function getDiscordLoginPath({
  type,
  redirectUrl,
  authFlowType
}: {
  type: AuthType;
  redirectUrl: string;
  authFlowType?: OauthFlowType;
}) {
  const authFlow = authFlowType ? `&authFlowType=${authFlowType}` : '';

  return `/api/discord/oauth?type=${type}${authFlow}&redirect=${redirectUrl ?? '/'}`;
}
