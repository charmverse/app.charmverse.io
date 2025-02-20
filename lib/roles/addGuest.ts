import type { Prisma, SpaceRole, User, VerifiedEmail } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { isUUID, isValidEmail, uid } from '@packages/utils/strings';
import { checkUserSpaceBanStatus } from '@root/lib/members/checkUserSpaceBanStatus';
import { sessionUserRelations } from '@root/lib/session/config';
import { postUserCreate } from '@root/lib/users/postUserCreate';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError } from '@root/lib/utils/errors';

type GuestToAdd = {
  userIdOrEmail: string;
  spaceId: string;
};

/**
 * @spaceRoles - Will only be the spaceRole for the spaceId passed in
 */
type UserFromGuest = User & {
  verifiedEmails: VerifiedEmail[];
  spaceRoles: SpaceRole[];
};

type GuestAddedResult = {
  user: UserFromGuest;
  isNewUser: boolean;
  isNewSpaceRole: boolean;
};

export async function addGuest({ userIdOrEmail, spaceId }: GuestToAdd) {
  if (!isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid spaceId: ${spaceId}`);
  }

  const userIdIsUuid = isUUID(userIdOrEmail);
  const userIdIsEmail = userIdIsUuid ? false : isValidEmail(userIdOrEmail);

  if (!userIdIsUuid && !userIdIsEmail) {
    throw new InvalidInputError(`Invalid userIdOrEmail: ${userIdOrEmail}`);
  }

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceIds: [spaceId],
    userId: userIdIsUuid ? userIdOrEmail : undefined,
    emails: userIdIsEmail ? [userIdOrEmail] : []
  });

  if (isUserBannedFromSpace) {
    throw new UnauthorisedActionError(`User with that ${userIdIsUuid ? 'id' : 'email'} has been banned from space`);
  }

  const spaceWithDomain = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (!spaceWithDomain) {
    throw new DataNotFoundError(`Space not found: ${spaceId}`);
  }

  const query: Prisma.UserWhereInput = userIdIsUuid
    ? {
        id: userIdOrEmail
      }
    : {
        verifiedEmails: {
          some: {
            email: userIdOrEmail
          }
        }
      };

  let user = await prisma.user.findFirst({
    where: query,
    include: {
      spaceRoles: {
        where: {
          spaceId
        }
      },
      verifiedEmails: true
    }
  });

  // Keep a record of the fact that user did not exist before creation
  const userExists = !!user;

  if (!userExists && userIdIsUuid) {
    throw new DataNotFoundError(`User not found: ${userIdOrEmail}`);
  }

  if (!userExists) {
    user = await prisma.user.create({
      data: {
        username: userIdOrEmail,
        path: uid(),
        identityType: 'VerifiedEmail',
        verifiedEmails: {
          create: {
            avatarUrl: '',
            name: userIdOrEmail,
            email: userIdOrEmail
          }
        }
      },
      include: {
        spaceRoles: true,
        verifiedEmails: true
      }
    });
  } else if (user?.claimed === false) {
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        claimed: true
      },
      include: sessionUserRelations
    });
    postUserCreate({ user: updatedUser, identityType: 'VerifiedEmail', signupAnalytics: {} });
  }

  const existingSpaceRole = user!.spaceRoles.find((sr) => sr.spaceId === spaceId);
  let newSpaceRole: SpaceRole | undefined;

  if (!existingSpaceRole) {
    newSpaceRole = await prisma.spaceRole.create({
      data: {
        space: { connect: { id: spaceId } },
        user: { connect: { id: user!.id } },
        isGuest: true
      }
    });
  }

  const result: GuestAddedResult = {
    user: {
      ...user!,
      spaceRoles: [existingSpaceRole ?? (newSpaceRole as SpaceRole)]
    },
    isNewUser: !userExists,
    isNewSpaceRole: !existingSpaceRole
  };

  return result;
}
