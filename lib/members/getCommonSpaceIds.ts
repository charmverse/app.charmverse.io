import { prisma } from 'db';
import type { CommonSpacesInput } from 'lib/members/interfaces';

export async function getCommonSpaceIds ({ memberId, requestingUserId, spaceId }: CommonSpacesInput): Promise<string[]> {
  if (!requestingUserId) {
    return [];
  }

  const commonSpaces = await prisma.space.findMany({
    where: {
      id: spaceId || undefined,
      AND: [
        {
          spaceRoles: {
            some: {
              userId: memberId
            }
          }
        },
        {
          spaceRoles: {
            some: {
              userId: requestingUserId
            }
          }
        }
      ]
    },
    select: { id: true }
  });

  return commonSpaces.map(s => s.id);
}
