// Note: NODE_ENV can only be 'development' or 'production' according to Next.js, but we don't want to mix them with test env
export const isTestEnv = process.env.NEXT_PUBLIC_APP_ENV === 'test';
export const isStagingEnv = process.env.NEXT_PUBLIC_APP_ENV === 'staging';
export const isDevEnv = process.env.NODE_ENV === 'development' && !isTestEnv && !isStagingEnv;
export const isProdEnv = process.env.NODE_ENV === 'production' && !isTestEnv && !isStagingEnv;
export const isNodeEnv = typeof window === 'undefined';
export const appEnv = isProdEnv ? 'production' : isStagingEnv ? 'staging' : isTestEnv ? 'test' : 'development';
export const baseUrl = process.env.DOMAIN as string | undefined;
// for cookies
export const authSecret = process.env.AUTH_SECRET as string | undefined;
// export const cookieDomain = process.env.COOKIE_DOMAIN as string | undefined;
export const cookieDomain = undefined; // TODO: set cookie domain so that we can have cross-subdomain sessions
export const cookieName = 'charm.sessionId';
// web sockets
export const websocketsHost = process.env.NEXT_PUBLIC_WEBSOCKETS_HOST;
