import type { User } from '@prisma/client';
import type { TokenPayload } from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { googleOAuthClientId, googleOAuthClientSecret } from 'config/constants';
import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getUserProfile } from 'lib/users/getUser';
import { coerceToMilliseconds } from 'lib/utilities/dates';
import { InsecureOperationError, InvalidInputError, SystemError, UnauthorisedActionError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

const googleOAuthClient = new OAuth2Client(googleOAuthClientId, googleOAuthClientSecret);

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
export async function loginWithGoogle(idToken: string): Promise<LoggedInUser> {
  try {
    const verified = await verifyToken(idToken);

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
                username: email
              }
            }
      }
    });

    return getUserProfile('id', createdGoogleAccount.userId);
  } catch (err) {
    if (err! instanceof SystemError) {
      throw new InsecureOperationError(`Could not verify the Google ID token that was provided`);
    }

    throw err;
  }
}
