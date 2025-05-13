import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import type { LoggedInUser } from '@packages/profile/getUser';
import { countConnectableIdentities } from '@packages/users/countConnectableIdentities';
import { softDeleteUserWithoutConnectableIdentities } from '@packages/users/softDeleteUserWithoutConnectableIdentities';
import { updateUsedIdentity } from '@packages/users/updateUsedIdentity';
import { InvalidInputError, UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { firebaseApp } from '@packages/lib/google/firebaseApp';
import type { LoginWithGoogleRequest } from '@packages/lib/google/loginWithGoogle';
import { checkUserSpaceBanStatus } from '@packages/lib/members/checkUserSpaceBanStatus';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(connectEmailAccount);

async function connectEmailAccount(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const userId = req.session.user.id;

  const toVerify: LoginWithGoogleRequest = req.body;

  const verificationResult = await firebaseApp.auth().verifyIdToken(toVerify.accessToken);

  if (!verificationResult.email) {
    throw new InvalidInputError(`No email found in verification result`);
  }

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      space: {
        select: {
          id: true
        }
      }
    }
  });
  const userSpaceIds = spaceRoles.map((role) => role.space.id);

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceIds: userSpaceIds,
    emails: [verificationResult.email]
  });

  if (isUserBannedFromSpace) {
    throw new UnauthorisedActionError('You need to leave space before you can add this email to your account');
  }

  const existingVerifiedEmailAccount = await prisma.verifiedEmail.findUnique({
    where: {
      email: verificationResult.email
    },
    include: {
      user: {
        include: sessionUserRelations
      }
    }
  });

  const existingGoogleAccount = await prisma.googleAccount.findUnique({
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
    if (existingVerifiedEmailAccount && existingVerifiedEmailAccount.user.id !== userId) {
      if (countConnectableIdentities(existingVerifiedEmailAccount.user) <= 1) {
        await tx.user.update({
          where: {
            id: existingVerifiedEmailAccount.user.id
          },
          data: {
            deletedAt: new Date()
          }
        });
      } else {
        await updateUsedIdentity(existingVerifiedEmailAccount.userId, undefined, tx);
      }
    }

    // Soft delete old user since the Google Account was their last identity
    if (existingGoogleAccount && existingGoogleAccount.user.id !== userId) {
      await tx.googleAccount.update({
        where: {
          email: verificationResult.email
        },
        data: {
          user: { connect: { id: userId } }
        }
      });
      if (countConnectableIdentities(existingGoogleAccount.user) <= 1) {
        await tx.user.update({
          where: {
            id: existingGoogleAccount.user.id
          },
          data: {
            deletedAt: new Date()
          }
        });
      } else {
        await updateUsedIdentity(existingGoogleAccount.user.id, undefined, tx);
      }
    }

    return upsertedEmail;
  });
  return res.status(200).json(afterUpdate.user);
}

export default withSessionRoute(handler);
