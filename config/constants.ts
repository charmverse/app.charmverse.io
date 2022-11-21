export const isTestEnv = process.env.APP_ENV === 'test';
// NODE_ENV can only be 'development' or 'production' according to Next.js, but we don't want to mix them with test env
export const isDevEnv = process.env.NODE_ENV === 'development' && !isTestEnv;
export const isProdEnv = process.env.NODE_ENV === 'production' && !isTestEnv;
export const isNodeEnv = typeof window === 'undefined';
export const baseUrl = process.env.DOMAIN as string | undefined;
export const cookieDomain = process.env.COOKIE_DOMAIN as string | undefined;
export const socketsHost = process.env.NEXT_PUBLIC_SOCKETS_HOST;
export const socketsPort = process.env.NEXT_PUBLIC_SOCKETS_PORT;
