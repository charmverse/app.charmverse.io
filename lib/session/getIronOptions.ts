import type { IronSessionOptions } from 'iron-session';

// import the "optional" auth secret here so it doesnt throw an error at build time
import { authSecret, baseUrl, cookieName } from 'config/constants';

export function getIronOptions(): IronSessionOptions {
  if (!authSecret) {
    throw new Error('AUTH_SECRET is not defined');
  }
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
