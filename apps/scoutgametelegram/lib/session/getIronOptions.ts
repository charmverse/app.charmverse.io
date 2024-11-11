import type { SessionOptions } from 'iron-session';

export function getIronOptions({
  sameSite = 'lax',
  ...restOptions
}: SessionOptions['cookieOptions'] = {}): SessionOptions {
  const baseUrl = process.env.DOMAIN;
  const authSecret = process.env.AUTH_SECRET;
  const cookieName = process.env.AUTH_COOKIE || 'scoutgame-tg-session';

  if (!authSecret) {
    throw new Error('AUTH_SECRET is not defined');
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
