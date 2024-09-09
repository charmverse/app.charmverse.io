import { InvalidInputError, UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { firebaseApp } from '@root/lib/google/firebaseApp';
import { checkUserSpaceBanStatus } from '@root/lib/members/checkUserSpaceBanStatus';
import { getUserProfile } from '@root/lib/profile/getUser';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { sessionUserRelations } from '@root/lib/session/config';

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

  const [matchedUser, googleAccount, notificationEmailUser] = await Promise.all([
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
    }),
    prisma.user.findFirst({
      where: {
        email: verificationResult.email
      },
      include: sessionUserRelations
    })
  ]);

  let user: LoggedInUser | null = matchedUser;

  let isNew = false;

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
  } else if (!user && notificationEmailUser) {
    await prisma.verifiedEmail.create({
      data: {
        avatarUrl: magicLink.avatarUrl ?? verificationResult.picture ?? '',
        email: verificationResult.email,
        name: verificationResult.name || verificationResult.email,
        user: { connect: { id: notificationEmailUser.id } }
      }
    });
    user = notificationEmailUser;
  } else if (!user) {
    isNew = true;
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
    const userId = user.id;

    if (user.claimed === false) {
      await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          claimed: true
        }
      });

      isNew = true;
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

    await prisma.verifiedEmail.update({
      where: {
        email: verificationResult.email
      },
      data: {
        avatarUrl: magicLink.avatarUrl ?? verificationResult.picture ?? '',
        name: verificationResult.name || verificationResult.email
      }
    });
  }

  const updatedUser = await getUserProfile('id', (user as LoggedInUser).id);

  return {
    isNew,
    user: updatedUser
  };
}
