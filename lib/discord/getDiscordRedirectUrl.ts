import { appSubdomain, isProdEnv, isStagingEnv } from 'config/constants';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';

export function getDiscordRedirectUrl(host: string | undefined, redirectTo: string) {
  const protocol = isProdEnv || isStagingEnv ? `https://` : `http://`;

  if (!host) {
    return new URL(`${protocol}//${appSubdomain}.${getAppApexDomain()}`);
  }

  return new URL(redirectTo, `${protocol}${host}`);
}
