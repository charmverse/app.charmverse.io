import { googleOAuthClientIdSensitive } from 'config/constants';
import { getClient } from 'lib/google/authorization/authClient';
import { loginWithGoogle } from 'lib/google/loginWithGoogle';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';
import { InvalidInputError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

export type LoginWithGoogleRequest = {
  code: string;
  signupAnalytics?: Partial<SignupAnalytics>;
};
export async function loginWithGoogleCode({
  code,
  signupAnalytics = {}
}: LoginWithGoogleRequest): Promise<LoggedInUser> {
  const redirectUri = `${getCallbackDomain()}/authenticate/google`;
  const oauthParams = {
    audience: googleOAuthClientIdSensitive,
    redirectUri
  };

  const client = getClient(redirectUri);
  const { tokens } = await client.getToken(code);
  const idToken = tokens.id_token;

  if (!idToken) {
    throw new InvalidInputError(`Invalid google authentication code`);
  }

  return loginWithGoogle({ accessToken: idToken, signupAnalytics, oauthParams });
}
