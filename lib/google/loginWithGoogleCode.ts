import { log } from '@charmverse/core/log';
import { googleOAuthClientIdSensitive } from '@root/config/constants';
import { getClient } from '@root/lib/google/authorization/authClient';
import { loginWithGoogle } from '@root/lib/google/loginWithGoogle';
import type { SignupAnalytics } from '@root/lib/metrics/mixpanel/interfaces/UserEvent';
import { getCallbackDomain } from '@root/lib/oauth/getCallbackDomain';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { InvalidInputError } from '@root/lib/utils/errors';

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
