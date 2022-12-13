import type { TokenPayload } from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';

import { googleOAuthClientId, googleOAuthClientSecret } from 'config/constants';
import { prisma } from 'db';
import { getUserProfile } from 'lib/users/getUser';
import { coerceToMilliseconds } from 'lib/utilities/dates';
import { InsecureOperationError, InvalidInputError, SystemError, UnauthorisedActionError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

const googleOAuthClient = new OAuth2Client(googleOAuthClientId, googleOAuthClientSecret);

export type LoginWithGoogleRequest = {
  accessToken: string;
  displayName: string;
  avatarUrl: string;
};

// https://developers.google.com/people/quickstart/nodejs
async function verifyToken(idToken: string): Promise<TokenPayload> {
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
export async function loginWithGoogle({
  accessToken,
  displayName,
  avatarUrl
}: LoginWithGoogleRequest): Promise<LoggedInUser> {
  try {
    const verified = await verifyToken(accessToken);

    const email = verified.email;

    if (!email) {
      throw new InvalidInputError(`Email required to complete signup`);
    }

    const googleAccount = await prisma.googleAccount.findUnique({
      where: {
        email
      },
      include: {
        user: true
      }
    });

    // No GoogleUser details provided
    if (googleAccount) {
      return getUserProfile('id', googleAccount.userId);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email
      }
    });

    const createdGoogleAccount = await prisma.googleAccount.create({
      data: {
        name: displayName,
        avatarUrl,
        email,
        user: existingUser
          ? {
              connect: {
                id: existingUser.id
              }
            }
          : {
              create: {
                identityType: 'Google',
                username: displayName
              }
            }
      }
    });

    return getUserProfile('id', createdGoogleAccount.userId);
  } catch (err) {
    if (err instanceof SystemError === false) {
      throw new InsecureOperationError(`Could not verify the Google ID token that was provided`);
    }

    throw err;
  }
}
