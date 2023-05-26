import type { IncomingMessage } from 'http';

import type { IronSessionOptions } from 'iron-session';

import { baseUrl, cookieName } from 'config/constants';
import { authSecret } from 'lib/session/config';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';
import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';
import { isLocalhostAlias } from 'lib/utilities/domains/isLocalhostAlias';

export function getIronOptions(req?: IncomingMessage): IronSessionOptions {
  const customDomain = getValidCustomDomain(req?.headers.host);

  const ironOptions: IronSessionOptions = {
    cookieName,
    password: authSecret,
    cookieOptions: {
      sameSite: 'strict' as const,
      // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
      secure: typeof baseUrl === 'string' && baseUrl.includes('https'),
      domain: isLocalhostAlias(req?.headers.host) || customDomain ? undefined : getAppApexDomain()
    }
  };
  return ironOptions;
}
