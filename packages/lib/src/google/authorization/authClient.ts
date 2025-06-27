import {
  googleOAuthClientIdSensitive as googleOAuthClientId,
  googleOAuthClientSecretSensitive as googleOAuthClientSecret
} from '@packages/config/constants';
import { log } from '@packages/core/log';
import { OAuth2Client } from 'google-auth-library';

export type GoogleLoginOauthParams = {
  redirectUri?: string;
  audience?: string;
};

// The OAuth2Client is stateful when using user credentials, so as a best practice, we always create a new one each time
// ref: https://github.com/googleapis/google-api-nodejs-client/issues/2080
export function getClient(redirectUri?: string) {
  return new OAuth2Client(
    googleOAuthClientId,
    googleOAuthClientSecret,
    // use 'postmessage' as redirect_uri because we use ux_mode: popup on the frontend
    redirectUri || 'postmessage'
  );
}

export async function getCredentialsFromGoogleCode(code: string, redirectUri?: string) {
  const client = getClient(redirectUri);
  const { tokens } = await client.getToken(code);

  if (tokens?.access_token) {
    // retrieve email address
    const tokenInfo = await client.getTokenInfo(tokens.access_token);
    if (tokenInfo.email) {
      return {
        email: tokenInfo.email,
        tokens
      };
    } else {
      log.warn('No email returned from google auth', tokenInfo);
    }
  }
  return null;
}
