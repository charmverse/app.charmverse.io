import type { Prisma, Space, SpaceRole, User, VerifiedEmail } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { isUUID, isValidEmail } from 'lib/utilities/strings';

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
  spaceDomain: string;
};

export async function addGuest({ userIdOrEmail, spaceId }: GuestToAdd) {
  if (!isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid spaceId: ${spaceId}`);
  }

  const userIdIsUiid = isUUID(userIdOrEmail);
  const userIdIsEmail = userIdIsUiid ? false : isValidEmail(userIdOrEmail);

  if (!userIdIsUiid && !userIdIsEmail) {
    throw new InvalidInputError(`Invalid userIdOrEmail: ${userIdOrEmail}`);
  }

  const spaceWithDomain = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (!spaceWithDomain) {
    throw new DataNotFoundError(`Space not found: ${spaceId}`);
  }

  const query: Prisma.UserWhereInput = userIdIsUiid
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

  if (!userExists && userIdIsUiid) {
    throw new DataNotFoundError(`User not found: ${userIdOrEmail}`);
  }

  if (!userExists) {
    user = await prisma.user.create({
      data: {
        username: userIdOrEmail,
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
    isNewSpaceRole: !existingSpaceRole,
    spaceDomain: spaceWithDomain.domain
  };

  return result;
}
