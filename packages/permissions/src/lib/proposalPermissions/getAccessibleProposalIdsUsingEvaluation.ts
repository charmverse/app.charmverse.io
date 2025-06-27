import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import type { PreComputedSpaceRole } from '@packages/core/permissions';
import { hasAccessToSpace, isProposalAuthor } from '@packages/core/permissions';
import type { ListProposalsRequest } from '@packages/core/proposals';
import { getCurrentEvaluation } from '@packages/core/proposals';

import { computeSpacePermissions } from 'lib/spacePermissions/computeSpacePermissions';

export async function getAccessibleProposalIdsUsingEvaluation({
  spaceId,
  userId,
  onlyAssigned,
  preComputedSpaceRole
}: ListProposalsRequest & PreComputedSpaceRole): Promise<string[]> {
  // Handle outside user case
  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId,
    preComputedSpaceRole
  });

  const spacePermissions = await computeSpacePermissions({
    resourceId: spaceId,
    userId,
    preComputedSpaceRole: spaceRole
  });

  const baseQuery: Prisma.ProposalWhereInput = {
    spaceId
  };
  const userRoles = !spaceRole
    ? []
    : await prisma.spaceRoleToRole
        .findMany({
          where: {
            role: {
              spaceId
            },
            spaceRoleId: spaceRole.id
          },
          select: {
            id: true,
            roleId: true
          }
        })
        .then((assignedRoles) => assignedRoles.map((role) => role.roleId));

  const userRolesMapped = userRoles.reduce(
    (acc, val) => {
      acc[val] = val;
      return acc;
    },
    {} as Record<string, string>
  );

  /**
   * Only used if looking for proposals where user is an author or reviewer, if onlyAssigned flag is passed
   * */
  const onlyAssignedQuery: Prisma.ProposalWhereInput = onlyAssigned
    ? {
        OR: [
          {
            createdBy: userId
          },
          {
            authors: {
              some: {
                userId
              }
            }
          },
          {
            reviewers: {
              some: {
                systemRole: 'space_member'
              }
            }
          },
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
                roleId: {
                  in: userRoles
                }
              }
            }
          }
        ]
      }
    : {};

  if (spaceRole?.isAdmin) {
    const adminProposals = await prisma.proposal.findMany({
      where: {
        ...baseQuery,
        ...onlyAssignedQuery
      },
      select: {
        id: true,
        createdBy: true,
        authors: true,
        status: true,
        evaluations: {
          select: {
            result: true,
            index: true,
            reviewers: true,
            finalStep: true,
            appealedAt: true
          }
        }
      }
    });

    if (!onlyAssigned) {
      return adminProposals.map((proposal) => proposal.id);
    }

    return adminProposals
      .filter((proposal) => {
        if (isProposalAuthor({ proposal, userId })) {
          return true;
          // Don't return onlyAssigned if proposal is draft
        } else if (proposal.status === 'draft') {
          return false;
        }

        const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

        if (!currentEvaluation) {
          log.warn(`Proposal ${proposal.id} has no current evaluation`, {
            pageId: proposal.id,
            proposalId: proposal.id,
            spaceId
          });
          return false;
        }

        const { reviewers } = currentEvaluation;

        if (reviewers.some((r) => r.systemRole === 'space_member')) {
          return true;
        } else if (reviewers.some((r) => r.userId === userId)) {
          return true;
        } else if (reviewers.some((r) => r.roleId && userRolesMapped[r.roleId])) {
          return true;
        }
        return false;
      })
      .map((proposal) => proposal.id);
  }

  const matchingProposals = await prisma.proposal.findMany({
    where: {
      ...baseQuery,
      ...onlyAssignedQuery
    },
    select: {
      id: true,
      status: true,
      authors: true,
      createdBy: true,
      reviewers: {
        select: {
          userId: true,
          roleId: true,
          systemRole: true
        }
      },
      evaluations: {
        select: {
          proposalId: true,
          index: true,
          result: true,
          permissions: true,
          finalStep: true,
          reviewers: {
            select: {
              userId: true,
              roleId: true,
              systemRole: true
            }
          },
          appealedAt: true
        },
        orderBy: {
          index: 'asc'
        }
      }
    }
  });

  const filteredProposals = matchingProposals.filter((proposal) => {
    const isAuthor = isProposalAuthor({ proposal, userId });
    if (proposal.status === 'draft') {
      return isAuthor;
    }

    if (spacePermissions.deleteAnyProposal) {
      return true;
    }

    if (isAuthor) {
      return true;
    }

    const { evaluations } = proposal;
    const currentEvaluation = getCurrentEvaluation(evaluations);

    if (!currentEvaluation) {
      log.warn(`Proposal ${proposal.id} has no current evaluation`, {
        pageId: proposal.id,
        proposalId: proposal.id,
        spaceId
      });
      return false;
    }

    // Public operation applies to any user - User without a space role can't get access any other way
    if (currentEvaluation?.permissions.some((p) => p.systemRole === 'public')) {
      return true;
    } else if (!spaceRole) {
      return false;
    }

    const isCurrentEvaluationReviewer = currentEvaluation.reviewers.some(
      (r) =>
        (r.userId && r.userId === userId) || (r.roleId && userRolesMapped[r.roleId]) || r.systemRole === 'space_member'
    );

    const isProposalReviewer = isCurrentEvaluationReviewer
      ? true
      : proposal.reviewers.some(
          (r) =>
            (r.userId && r.userId === userId) ||
            (r.roleId && userRolesMapped[r.roleId]) ||
            r.systemRole === 'space_member'
        );
    // Current reviewer can always see the proposal in current evaluation step
    if (isCurrentEvaluationReviewer) {
      return true;
      // If using only assigned flag, we only want to return proposals where the user is an author or current reviewer
    } else if (onlyAssigned) {
      return false;
    }

    return currentEvaluation.permissions.some((permission) => {
      if (permission.operation === 'view') {
        if (permission.systemRole === 'all_reviewers' && isProposalReviewer) {
          return true;
        } else if (permission.systemRole === 'space_member') {
          return true;
        } else if (permission.roleId && userRolesMapped[permission.roleId]) {
          return true;
        } else if (permission.userId === userId) {
          return true;
        }
      }
      return false;
    });
  });

  return filteredProposals.map((proposal) => proposal.id);
}
