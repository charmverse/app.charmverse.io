import firebase from 'firebase-admin';
// import firebase from 'firebase-admin';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { googleWebClientConfig } from 'config/constants';
import { prisma } from 'db';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { onError, onNoMatch } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import randomName from 'lib/utilities/randomName';
import type { LoggedInUser } from 'models';

// const firebaseApp = firebase.initializeApp(googleWebClientConfig, 'google-authenticate');
const firebaseApp = firebase.initializeApp(googleWebClientConfig, 'google-authenticate');

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(verifyMagicLink);

async function verifyMagicLink(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const toVerify: LoginWithGoogleRequest = req.body;

  const verificationResult = await firebaseApp.auth().verifyIdToken(toVerify.accessToken);
  //  const token = await firebaseApp.appCheck().verifyToken(oobCode as string);

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          primaryEmail: verificationResult.email
        },
        {
          googleAccounts: {
            some: {
              email: verificationResult.email
            }
          }
        }
      ]
    },
    include: sessionUserRelations
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username: (verificationResult as any).name ?? randomName(),
        primaryEmail: verificationResult.email
      },
      include: sessionUserRelations
    });
  }
  req.session.user = { id: user.id };

  await req.session.save();
  return res.status(200).json(user);
}

export default withSessionRoute(handler);
