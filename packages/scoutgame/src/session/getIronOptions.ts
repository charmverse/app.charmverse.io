import { baseUrl, cookieName, authSecret } from '@packages/utils/constants';
import type { SessionOptions } from 'iron-session';

// when running with ngrok or local tunnel
const isLocalTunnel = process.env.IS_LOCAL_TUNNEL === 'true';

export function getIronOptions({
  sameSite = 'lax',
  ...restOptions
}: SessionOptions['cookieOptions'] = {}): SessionOptions {
  const ironOptions: SessionOptions = {
    cookieName,
    password: authSecret || '',
    cookieOptions: {
      sameSite: isLocalTunnel ? 'lax' : sameSite,
      // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
      secure: isLocalTunnel ? true : typeof baseUrl === 'string' && baseUrl.includes('https'),
      ...restOptions
    }
  };
  return ironOptions;
}
