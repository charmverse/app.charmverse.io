// import firebase from 'firebase-admin';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { firebaseApp } from 'lib/google/firebaseApp';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { countConnectableIdentities } from 'lib/users/countConnectableIdentities';
import { InvalidInputError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(connectEmailAccount);

async function connectEmailAccount(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const userId = req.session.user.id;

  const toVerify: LoginWithGoogleRequest = req.body;

  const verificationResult = await firebaseApp.auth().verifyIdToken(toVerify.accessToken);

  if (!verificationResult.email) {
    throw new InvalidInputError(`No email found in verification result`);
  }
  throw new InvalidInputError(`TEST ERROR`);

  const existingAccount = await prisma.verifiedEmail.findUnique({
    where: {
      email: verificationResult.email
    },
    include: {
      user: {
        include: sessionUserRelations
      }
    }
  });
  const afterUpdate = await prisma.$transaction(async (tx) => {
    const upsertedEmail = await tx.verifiedEmail.upsert({
      where: {
        email: verificationResult.email
      },
      create: {
        avatarUrl: verificationResult.picture ?? '',
        email: verificationResult.email as string,
        name: verificationResult.name || verificationResult.email,
        user: { connect: { id: userId } }
      },
      update: {
        user: {
          connect: {
            id: userId
          }
        }
      },
      include: {
        user: {
          include: sessionUserRelations
        }
      }
    });

    // Soft delete old user since the email was their last identity
    if (
      existingAccount &&
      existingAccount.user.id !== userId &&
      countConnectableIdentities(existingAccount.user) <= 1
    ) {
      await prisma.user.update({
        where: {
          id: existingAccount.user.id
        },
        data: {
          deletedAt: new Date()
        }
      });
    }

    return upsertedEmail;
  });
  return res.status(200).json(afterUpdate.user);
}

export default withSessionRoute(handler);
