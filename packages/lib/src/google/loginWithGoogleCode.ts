import { googleOAuthClientIdSensitive } from '@packages/config/constants';
import { log } from '@packages/core/log';
import { getClient } from '@packages/lib/google/authorization/authClient';
import { loginWithGoogle } from '@packages/lib/google/loginWithGoogle';
import { getCallbackDomain } from '@packages/lib/oauth/getCallbackDomain';
import type { SignupAnalytics } from '@packages/metrics/mixpanel/interfaces/UserEvent';
import type { LoggedInUser } from '@packages/profile/getUser';
import { InvalidInputError } from '@packages/utils/errors';

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
  try {
    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      throw new InvalidInputError(`Invalid google authentication code`);
    }

    return loginWithGoogle({ accessToken: idToken, signupAnalytics, oauthParams });
  } catch (e) {
    log.warn(`Could not verify authentication code`, { error: e, oauthParams });
    throw new InvalidInputError(`Could not verify authentication code`);
  }
}
