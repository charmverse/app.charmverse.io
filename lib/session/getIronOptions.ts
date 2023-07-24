import type { IronSessionOptions } from 'iron-session';

import { baseUrl, cookieName } from 'config/constants';
import { authSecret } from 'lib/session/config';

export function getIronOptions(): IronSessionOptions {
  const ironOptions: IronSessionOptions = {
    cookieName,
    password: authSecret,
    cookieOptions: {
      sameSite: 'strict' as const,
      // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
      secure: typeof baseUrl === 'string' && baseUrl.includes('https')
    }
  };
  return ironOptions;
}
