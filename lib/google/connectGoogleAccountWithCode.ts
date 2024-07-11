import { googleOAuthClientIdSensitive } from '@root/config/constants';
import { getClient } from 'lib/google/authorization/authClient';
import { connectGoogleAccount } from 'lib/google/connectGoogleAccount';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';
import { InvalidInputError } from 'lib/utils/errors';
import type { LoggedInUser } from '@root/models';

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
