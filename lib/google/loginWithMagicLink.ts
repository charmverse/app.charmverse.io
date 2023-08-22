import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { firebaseApp } from 'lib/google/firebaseApp';
import { sessionUserRelations } from 'lib/session/config';
import { getUserProfile } from 'lib/users/getUser';
import type { LoggedInUser } from 'models';

import type { LoginWithGoogleRequest } from './loginWithGoogle';

export type MagicLinkLoginRequest = {
  magicLink: LoginWithGoogleRequest;
};

type UserFromMagicLink = {
  user: LoggedInUser;
  isNew: boolean;
};

export async function loginWithMagicLink({ magicLink }: MagicLinkLoginRequest): Promise<UserFromMagicLink> {
  const verificationResult = await firebaseApp.auth().verifyIdToken(magicLink.accessToken);

  if (!verificationResult.email) {
    throw new InvalidInputError(`No email found in verification result`);
  }

  const [matchedUser, googleAccount] = await Promise.all([
    prisma.user.findFirst({
      where: {
        verifiedEmails: {
          some: {
            email: verificationResult.email
          }
        }
      },
      include: sessionUserRelations
    }),
    prisma.googleAccount.findUnique({
      where: {
        email: verificationResult.email
      },
      include: {
        user: {
          include: sessionUserRelations
        }
      }
    })
  ]);

  let user: LoggedInUser | null = matchedUser;

  let userWillBeCreated = false;

  if (!user && googleAccount) {
    await prisma.verifiedEmail.create({
      data: {
        avatarUrl: magicLink.avatarUrl ?? verificationResult.picture ?? '',
        email: verificationResult.email,
        name: verificationResult.name || verificationResult.email,
        user: { connect: { id: googleAccount.userId } }
      }
    });
    user = googleAccount.user;
  } else if (!user) {
    userWillBeCreated = true;
    user = await prisma.user.create({
      data: {
        username: verificationResult.email,
        identityType: 'VerifiedEmail',
        email: verificationResult.email,
        path: stringUtils.uid(),
        verifiedEmails: {
          create: {
            email: verificationResult.email,
            avatarUrl: magicLink.avatarUrl ?? verificationResult.picture ?? '',
            name: verificationResult.name || verificationResult.email
          }
        }
      },
      include: sessionUserRelations
    });
  } else {
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        verifiedEmails: {
          create: {
            email: verificationResult.email,
            avatarUrl: magicLink.avatarUrl ?? verificationResult.picture ?? '',
            name: verificationResult.name || verificationResult.email
          }
        }
      },
      include: sessionUserRelations
    });
  }

  const updatedUser = await getUserProfile('id', user.id);

  return {
    isNew: userWillBeCreated,
    user: updatedUser
  };
}
