import env from '@beam-australia/react-env';

// Environment
export const isTestEnv = (env('APP_ENV') ?? process.env.REACT_APP_APP_ENV ?? process.env.NODE_ENV) === 'test';
export const isStagingEnv = (env('APP_ENV') ?? process.env.REACT_APP_APP_ENV) === 'staging';
export const isProdEnv = process.env.NODE_ENV === 'production' && !isTestEnv && !isStagingEnv;
export const isDevEnv =
  (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && !isProdEnv && !isStagingEnv && !isTestEnv;

// Session
export const baseUrl = process.env.DOMAIN as string | undefined;
export const authSecret = process.env.AUTH_SECRET as string | undefined;
export const cookieName = process.env.AUTH_COOKIE || 'scoutgame-session';
