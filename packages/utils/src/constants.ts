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

export const GITHUB_CLIENT_ID = env('GITHUB_CLIENT_ID') ?? process.env.REACT_APP_GITHUB_CLIENT_ID;

export const awsS3Bucket = process.env.S3_UPLOAD_BUCKET as string;

// In CI, we want to have a private key for signing, but we don't need a fixed one. We also want to have errors if we are not in CI environment and CREDENTIAL_WALLET_KEY is not set
export const credentialsWalletPrivateKey = process.env.CREDENTIAL_WALLET_KEY;
