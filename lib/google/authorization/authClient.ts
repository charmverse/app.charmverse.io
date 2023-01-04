import { OAuth2Client } from 'google-auth-library';

import { googleOAuthClientId, googleOAuthClientSecret } from 'config/constants';
import log from 'lib/log';

// The OAuth2Client is stateful when using user credentials, so as a best practice, we always create a new one each time
// ref: https://github.com/googleapis/google-api-nodejs-client/issues/2080
export function getClient() {
  return new OAuth2Client(
    googleOAuthClientId,
    googleOAuthClientSecret,
    // use 'postmessage' as redirect_uri because we use ux_mode: popup on the frontend
    'postmessage'
  );
}

export async function getCredentialsFromGoogleCode(code: string) {
  const client = getClient();
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
