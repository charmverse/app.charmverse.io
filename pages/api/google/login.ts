import type { TokenPayload } from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { googleOAuthClientId } from 'config/constants';
import { prisma } from 'db';
import { loginWithGoogle } from 'lib/google/loginWithGoogle';
import { onError, onNoMatch } from 'lib/middleware';
import { saveSession } from 'lib/middleware/saveSession';
import { withSessionRoute } from 'lib/session/withSession';
import { coerceToMilliseconds } from 'lib/utilities/dates';
import { InsecureOperationError, InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';

const googleOAuthClient = new OAuth2Client(googleOAuthClientId);

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(loginWithGoogleController);

// See here

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
async function loginWithGoogleController(req: NextApiRequest, res: NextApiResponse) {
  const { idToken } = req.body;

  const loggedInUser = await loginWithGoogle(idToken as string);

  await saveSession({ req, userId: loggedInUser.id });

  res.status(200).send(loggedInUser);
}

export default withSessionRoute(handler);
