import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export async function getAssignedRoleIds({ spaceId, userId }: { userId?: string; spaceId: string }): Promise<string[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid spaceId "${spaceId}"`);
  }

  if (!userId) {
    return [];
  }

  const userSpaceRole = await prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        spaceId,
        userId
      }
    },
    select: {
      spaceRoleToRole: {
        select: {
          roleId: true
        }
      }
    }
  });

  return (userSpaceRole?.spaceRoleToRole ?? []).map((r) => r.roleId);
}
