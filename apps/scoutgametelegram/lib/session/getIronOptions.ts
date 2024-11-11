import type { SessionOptions } from 'iron-session';

import { baseUrl, cookieName, authSecret } from 'config/constants';

export function getIronOptions({
  sameSite = 'lax',
  ...restOptions
}: SessionOptions['cookieOptions'] = {}): SessionOptions {
  if (!authSecret) {
    throw new Error('AUTH_SECRET is not defined');
  }

  if (!cookieName) {
    throw new Error('AUTH_COOKIE is not defined');
  }

  const ironOptions: SessionOptions = {
    cookieName,
    password: authSecret,
    cookieOptions: {
      sameSite,
      // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
      secure: typeof baseUrl === 'string' && baseUrl.includes('https'),
      ...restOptions
    }
  };
  return ironOptions;
}
