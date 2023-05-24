import type { IncomingMessage } from 'http';

import type { IronSessionOptions } from 'iron-session';

import { baseUrl, cookieName } from 'config/constants';
import { authSecret } from 'lib/session/config';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';
import { isLocalhostAlias } from 'lib/utilities/domains/isLocalhostAlias';

export function getIronOptions(req?: IncomingMessage): IronSessionOptions {
  const ironOptions: IronSessionOptions = {
    cookieName,
    password: authSecret,
    cookieOptions: {
      sameSite: 'strict' as const,
      // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
      secure: typeof baseUrl === 'string' && baseUrl.includes('https'),
      domain: isLocalhostAlias(req?.headers.host) ? undefined : getAppApexDomain()
    }
  };
  return ironOptions;
}
