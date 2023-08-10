import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

/**
 * Get all proposals where user is an evaluator and evaluationType is Rubric
 */
export async function getProposalIdsEvaluatedByUser({
  spaceId,
  userId
}: {
  userId: string;
  spaceId: string;
}): Promise<string[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Valid spaceId is required`);
  }

  const { spaceRole } = await hasAccessToSpace({ spaceId, userId });

  if (!spaceRole || spaceRole.isGuest) {
    return [];
  }

  const isFreeSpace = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      paidTier: true
    }
  });

  return prisma.proposal
    .findMany({
      where: isFreeSpace
        ? {
            evaluationType: 'rubric',
            reviewers: {
              some: {
                userId
              }
            }
          }
        : {
            evaluationType: 'rubric',
            OR: [
              {
                reviewers: {
                  some: {
                    userId
                  }
                }
              },
              {
                reviewers: {
                  some: {
                    role: {
                      spaceRolesToRole: {
                        some: {
                          spaceRoleId: spaceRole.id
                        }
                      }
                    }
                  }
                }
              }
            ]
          },
      select: {
        id: true
      }
    })
    .then((data) => data.map((proposal) => proposal.id));

  // const hasAcce;
  // return prisma;
}
