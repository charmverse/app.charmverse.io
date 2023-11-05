import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';

export async function getAllReviewerUserIds({ proposalId }: { proposalId: string }): Promise<string[]> {
  if (!proposalId) {
    throw new InvalidInputError(`Valid proposalId is required`);
  }
  const proposalWithReviewers = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      space: {
        select: {
          id: true,
          paidTier: true
        }
      },
      reviewers: {
        select: {
          userId: true,
          roleId: true
        }
      }
    }
  });

  const userReviewers = proposalWithReviewers?.reviewers.filter((r) => !!r.userId).map((r) => r.userId) as string[];
  const roleReviewers = proposalWithReviewers?.reviewers.filter((r) => !!r.roleId).map((r) => r.roleId) as string[];

  const userReviewersByRole =
    roleReviewers.length === 0 || proposalWithReviewers.space.paidTier === 'free'
      ? []
      : await prisma.spaceRole
          .findMany({
            where: {
              spaceId: proposalWithReviewers.space.id,
              spaceRoleToRole: {
                some: {
                  roleId: {
                    in: roleReviewers
                  }
                }
              }
            },
            select: {
              userId: true
            }
          })
          .then((spaceRoles) => spaceRoles.map((sr) => sr.userId));

  const uniqueUserReviewers = arrayUtils.uniqueValues([...userReviewers, ...userReviewersByRole]);

  return uniqueUserReviewers;
}
