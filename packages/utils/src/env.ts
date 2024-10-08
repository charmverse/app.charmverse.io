import env from '@beam-australia/react-env';

// Note: NODE_ENV can only be 'development' or 'production' according to Next.js, but we don't want to mix them with test env
export const isTestEnv = (env('APP_ENV') ?? process.env.REACT_APP_APP_ENV ?? process.env.NODE_ENV) === 'test';
export const isStagingEnv = (env('APP_ENV') ?? process.env.REACT_APP_APP_ENV) === 'staging';
export const isProdEnv = process.env.NODE_ENV === 'production' && !isTestEnv && !isStagingEnv;
export const isDevEnv =
  (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && !isProdEnv && !isStagingEnv && !isTestEnv;

export const isNodeEnv = typeof window === 'undefined';
export const appEnv = isProdEnv ? 'production' : isStagingEnv ? 'staging' : isTestEnv ? 'test' : 'development';
export const baseUrl = process.env.DOMAIN as string | undefined;
