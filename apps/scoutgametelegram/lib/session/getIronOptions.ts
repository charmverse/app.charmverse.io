import { baseUrl, cookieName, authSecret } from '@packages/utils/constants';
import type { SessionOptions } from 'iron-session';

export function getIronOptions({
  sameSite = 'lax',
  ...restOptions
}: SessionOptions['cookieOptions'] = {}): SessionOptions {
  const ironOptions: SessionOptions = {
    cookieName,
    password: authSecret || '',
    cookieOptions: {
      sameSite,
      // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
      secure: typeof baseUrl === 'string' && baseUrl.includes('https'),
      ...restOptions
    }
  };
  return ironOptions;
}
