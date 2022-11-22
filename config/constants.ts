export const isTestEnv = process.env.APP_ENV === 'test';
// NODE_ENV can only be 'development' or 'production' according to Next.js, but we don't want to mix them with test env
export const isDevEnv = process.env.NODE_ENV === 'development' && !isTestEnv;
export const isProdEnv = process.env.NODE_ENV === 'production' && !isTestEnv;
export const isNodeEnv = typeof window === 'undefined';
export const baseUrl = process.env.DOMAIN as string | undefined;
// for cookies
export const authSecret = process.env.AUTH_SECRET as string | undefined;
export const cookieDomain = process.env.COOKIE_DOMAIN as string | undefined;
export const cookieName = 'charm.sessionId';
// web sockets
export const websocketsHost = process.env.NEXT_PUBLIC_WEBSOCKETS_HOST || '' as string;
