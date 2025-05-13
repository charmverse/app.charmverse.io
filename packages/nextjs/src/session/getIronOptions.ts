import { baseUrl, cookieName, authSecret } from '@packages/utils/constants';
import type { SessionOptions } from 'iron-session';

export function getIronOptions({ domain, sameSite = 'strict' }: SessionOptions['cookieOptions'] = {}): SessionOptions {
  if (!authSecret) {
    throw new Error('AUTH_SECRET is not defined');
  }
  const ironOptions: SessionOptions = {
    cookieName,
    password: authSecret,
    cookieOptions: {
      sameSite,
      domain,
      // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
      secure: typeof baseUrl === 'string' && baseUrl.includes('https')
    }
  };
  return ironOptions;
}
