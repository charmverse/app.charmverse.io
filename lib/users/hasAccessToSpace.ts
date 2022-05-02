import { prisma } from 'db';
import { InvalidInputError } from 'lib/utilities/errors';
import { AdministratorOnlyError, UserIsNotSpaceMemberError } from './errors';

interface Input {
  userId: string;
  spaceId: string;
  adminOnly?: boolean;
}

interface Result {
  error?: string;
  success?: boolean;
}

export async function hasAccessToSpace ({ userId, spaceId, adminOnly = false }: Input): Promise<Result> {

  if (!spaceId || !userId) {
    return new InvalidInputError('User ID and space ID are required');
  }

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });
  if (!spaceRole) {
    return new UserIsNotSpaceMemberError();
  }
  else if (adminOnly && spaceRole.isAdmin !== true) {
    return new AdministratorOnlyError();
  }
  return { success: true };
}
