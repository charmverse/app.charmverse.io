import type { TokenPayload } from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';

import { googleOAuthClientId, googleOAuthClientSecret } from 'config/constants';
import { coerceToMilliseconds } from 'lib/utilities/dates';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';

const googleOAuthClient = new OAuth2Client(googleOAuthClientId, googleOAuthClientSecret);

// https://developers.google.com/people/quickstart/nodejs
export async function verifyGoogleToken(idToken: string): Promise<TokenPayload> {
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: googleOAuthClientId
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new InvalidInputError('Invalid Google authentication token');
  }

  const now = Date.now();
  const { exp } = payload;

  const hasExpired = coerceToMilliseconds(exp) < now;
  if (hasExpired) {
    throw new UnauthorisedActionError('Authentication token has expired. Please try again.');
  }
  return payload;
}
