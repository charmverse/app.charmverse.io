import type { AuthType, OauthFlowType } from 'lib/oauth/interfaces';

export function getDiscordLoginPath({
  type,
  redirectUrl,
  authFlowType,
  onboarding = false
}: {
  onboarding?: boolean;
  type: AuthType;
  redirectUrl: string;
  authFlowType?: OauthFlowType;
}) {
  const authFlow = authFlowType ? `&authFlowType=${authFlowType}` : '';

  return `/api/discord/oauth?type=${type}${authFlow}&redirect=${
    redirectUrl ?? '/'
  }&onboarding=${onboarding.toString()}`;
}
