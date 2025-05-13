import type { LoggedInUser } from '@packages/profile/getUser';
import { InvalidInputError } from '@packages/utils/errors';
import { googleOAuthClientIdSensitive } from '@packages/config/constants';
import { getClient } from '@packages/lib/google/authorization/authClient';
import { connectGoogleAccount } from '@packages/lib/google/connectGoogleAccount';
import { getCallbackDomain } from '@packages/lib/oauth/getCallbackDomain';

export type ConnectAccountRequest = {
  code: string;
  userId: string;
};
export async function connectAccountWithGoogleCode({ code, userId }: ConnectAccountRequest): Promise<LoggedInUser> {
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

  return connectGoogleAccount({ accessToken: idToken, userId, oauthParams });
}
