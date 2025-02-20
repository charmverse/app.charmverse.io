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

export const googleFirebaseAdminConfig = {
  // replace `\` and `n` character pairs w/ single `\n` character
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  projectId: googleWebClientConfig.projectId,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};
export const magicLinkEmailCookie = 'magic-link';

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

// Github
export const githubPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY as string;
export const githubAppId = Number(process.env.GITHUB_APP_ID);

// Docusign
export const docusignClientId = process.env.DOCUSIGN_CLIENT_ID as string;
export const docusignClientSecret = process.env.DOCUSIGN_CLIENT_SECRET as string;
export const docusignOauthBaseUri = process.env.DOCUSIGN_OAUTH_BASE_URI as string;

// export const docusignBaseUri = process.env.DOCUSIGN_BASE_URI as string;
// export const docusignApiKey = process.env.DOCUSIGN_API_KEY as string;
// This is a Personal Access Token for the Github API, generated within an individual developer account
export const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN as string;
