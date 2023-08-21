import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { firebaseApp } from 'lib/google/firebaseApp';
import { sessionUserRelations } from 'lib/session/config';
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

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          googleAccounts: {
            some: {
              email: verificationResult.email
            }
          }
        },
        {
          verifiedEmails: {
            some: {
              email: verificationResult.email
            }
          }
        }
      ]
    },
    include: sessionUserRelations
  });

  let userWillBeCreated = false;

  if (!user) {
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
  } else if (user && !user.verifiedEmails.some((verifiedEmail) => verifiedEmail.email === verificationResult.email)) {
    user = await prisma.user.update({
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

  return {
    isNew: userWillBeCreated,
    user
  };
}
