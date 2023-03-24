import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { firebaseApp } from 'lib/google/firebaseApp';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import type { SignupCookieType } from 'lib/metrics/userAcquisition/interfaces';
import { onError, onNoMatch } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(verifyMagicLink);

async function verifyMagicLink(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const toVerify: LoginWithGoogleRequest = req.body;

  const verificationResult = await firebaseApp.auth().verifyIdToken(toVerify.accessToken);

  if (!verificationResult.email) {
    throw new InvalidInputError(`No email found in verification result`);
  }

  let user = await prisma.user.findFirst({
    where: {
      verifiedEmails: {
        some: {
          email: verificationResult.email
        }
      }
    },
    include: sessionUserRelations
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username: verificationResult.email,
        identityType: 'VerifiedEmail',
        email: verificationResult.email,
        verifiedEmails: {
          create: {
            email: verificationResult.email,
            avatarUrl: verificationResult.picture ?? '',
            name: verificationResult.name || verificationResult.email
          }
        }
      },
      include: sessionUserRelations
    });

    const cookiesToParse = req.cookies as Record<SignupCookieType, string>;
    const signupAnalytics = extractSignupAnalytics(cookiesToParse);
    updateTrackUserProfile(user);
    trackUserAction('sign_up', { userId: user.id, identityType: 'VerifiedEmail', ...signupAnalytics });
  } else if (user && !user.email) {
    user = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        email: verificationResult.email
      },
      include: sessionUserRelations
    });
  }

  req.session.user = { id: user.id };

  await req.session.save();
  return res.status(200).json(user);
}

export default withSessionRoute(handler);
