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
// for cookies
export const authSecret = process.env.AUTH_SECRET as string | undefined;
export const recoveryCodeSecretKey = process.env.RECOVERY_CODE_SECRET_KEY as string | undefined;
// export const cookieDomain = process.env.COOKIE_DOMAIN as string | undefined;
export const cookieDomain = undefined; // TODO: set cookie domain so that we can have cross-subdomain sessions
export const cookieName = 'charm.sessionId';
// web sockets
export const websocketsHost = env('WEBSOCKETS_HOST');
// Google config
export const googleOAuthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
export const googleOAuthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

// Google client
// To retrieve these values, go to Firebase, then project settings, and retrieve the JSON for the web client. You can then assign the values for each key in the client secrets area.
export const googleWebClientConfig = {
  apiKey: env('GOOGLE_API_KEY'),
  authDomain: env('GOOGLE_AUTH_DOMAIN'),
  projectId: env('GOOGLE_PROJECT_ID'),
  storageBucket: env('GOOGLE_STORAGE_BUCKET'),
  messagingSenderId: env('GOOGLE_MESSAGING_SENDER_ID'),
  appId: env('GOOGLE_APP_ID')
};

export const charmverseDiscordInvite = 'https://discord.gg/ACYCzBGC2M';
export const userManualUrl = 'https://tiny.charmverse.io/user-manual';
// Google config with sensitive scopes (to eventually replace the primary config)
export const googleOAuthClientIdSensitive =
  process.env.GOOGLE_OAUTH_CLIENT_ID_SENSITIVE || env('GOOGLE_OAUTH_CLIENT_ID_SENSITIVE');
export const googleOAuthClientSecretSensitive = process.env.GOOGLE_OAUTH_CLIENT_SECRET_SENSITIVE;

// Permissions API
export const permissionsApiUrl = process.env.PERMISSIONS_API_URL ?? 'http://127.0.0.1:3001';
export const permissionsApiAuthKey = process.env.PERMISSIONS_API_AUTH_KEY ?? 'key';
export const webhookEndpoint = 'api/v1/webhooks/addToDatabase';

export const appSubdomain = 'app';

// In CI, we want to have a private key for signing, but we don't need a fixed one. We also want to have errors if we are not in CI environment and CREDENTIAL_WALLET_KEY is not set
export const credentialsWalletPrivateKey = process.env.CREDENTIAL_WALLET_KEY;
export const awsS3Bucket = process.env.S3_UPLOAD_BUCKET as string;

// Ceramic Node
export const graphQlServerEndpoint = process.env.CERAMIC_GRAPHQL_SERVER as string;

// Github
export const githubPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY as string;
export const githubAppId = Number(process.env.GITHUB_APP_ID);
