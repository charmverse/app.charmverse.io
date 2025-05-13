import type { SpaceRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { SystemError } from '@packages/utils/errors';
import { InvalidInputError } from '@packages/utils/errors';

import { AdministratorOnlyError, UserIsGuestError, UserIsNotSpaceMemberError } from './errors';

/**
 * @param userId - The ID of the user to check. If empty, the hasAccess should always return an error
 * @disallowGuest - If true, the user must be a member or admin of the space. If false, the user can be a guest
 */
interface Input {
  userId?: string;
  spaceId: string;
  adminOnly?: boolean;
  disallowGuest?: boolean;
}

interface Result {
  error?: SystemError;
  success?: boolean;
  isAdmin?: boolean;
  spaceRole?: SpaceRole;
}

export async function hasAccessToSpace({ userId, spaceId, adminOnly = false, disallowGuest }: Input): Promise<Result> {
  if (!spaceId || !userId) {
    return { error: new InvalidInputError('User ID and space ID are required') };
  }

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });
  if (!spaceRole) {
    return { error: new UserIsNotSpaceMemberError() };
  } else if (adminOnly && spaceRole.isAdmin !== true) {
    return { error: new AdministratorOnlyError() };
  } else if (spaceRole.isGuest === true && disallowGuest) {
    return { error: new UserIsGuestError() };
  }
  return { success: true, isAdmin: spaceRole.isAdmin, spaceRole };
}
