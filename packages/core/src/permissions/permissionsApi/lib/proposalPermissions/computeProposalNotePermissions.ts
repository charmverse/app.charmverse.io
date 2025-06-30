import type { ProposalAuthor, ProposalReviewer, ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma';
import type { PageOperations } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError } from '../../../../errors';
import { isProposalAuthor, AvailablePagePermissions, hasAccessToSpace } from '../../../index';
import type { PagePermissionFlags, PermissionComputeWithCachedData } from '../../../index';
import type { PageResource } from '../pagePermissions/policies';
import { pageResourceSelect } from '../pagePermissions/policies';

const applicableProposalNotePagePermissions: PageOperations[] = ['comment', 'create_poll', 'edit_content', 'read'];

export async function computeProposalNotePermissions({
  resourceId,
  preComputedSpaceRole,
  preFetchedResource,
  preFetchedUserRoleMemberships,
  userId,
  isReadonlySpace
}: PermissionComputeWithCachedData<PageResource> & { isReadonlySpace?: boolean }): Promise<PagePermissionFlags> {
  const permissions = new AvailablePagePermissions({ isReadonlySpace: isReadonlySpace ?? false });

  const page =
    preFetchedResource ??
    (await prisma.page.findUniqueOrThrow({
      where: { id: resourceId },
      select: pageResourceSelect()
    }));

  if (page.type !== 'proposal_notes') {
    throw new InvalidInputError(`Page ${resourceId} must be of type proposal_notes`);
  }

  if (!page.parentId) {
    throw new InvalidInputError(`Page ${resourceId} does not have a parent`);
  }

  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        id: page.parentId
      }
    },
    include: {
      authors: true,
      evaluations: {
        where: {
          type: {
            in: ['pass_fail', 'rubric', 'feedback']
          }
        },
        include: {
          reviewers: true
        }
      }
    }
  });

  if (!userId) {
    return permissions.empty;
  }

  const { spaceRole } = await hasAccessToSpace({ spaceId: page.spaceId, userId, preComputedSpaceRole });

  if (!spaceRole) {
    return permissions.empty;
  }

  if (spaceRole.isAdmin) {
    return permissions.addPermissions(applicableProposalNotePagePermissions).operationFlags;
  }

  // Now actually compute the permissions based on business logic
  const userRoleMemberships =
    preFetchedUserRoleMemberships ??
    (await prisma.spaceRoleToRole.findMany({
      where: { spaceRoleId: spaceRole.id }
    }));

  return computeProposalNotePermissionsRaw({
    userId,
    proposal,
    userRoleIds: userRoleMemberships.map((r) => r.roleId),
    isReadonlySpace
  });
}

export function computeProposalNotePermissionsRaw({
  userId,
  proposal,
  userRoleIds,
  isReadonlySpace
}: {
  userId?: string;
  proposal: {
    status: ProposalStatus;
    authors: ProposalAuthor[];
    evaluations: { type: ProposalEvaluationType; reviewers: ProposalReviewer[] }[];
    createdBy: string;
  };
  userRoleIds: string[];
  isReadonlySpace?: boolean;
}): PagePermissionFlags {
  const permissions = new AvailablePagePermissions({ isReadonlySpace: isReadonlySpace ?? false });

  // dont include author as reviewer for Feedback step
  const reviewers = proposal.evaluations.flatMap((evaluation) =>
    evaluation.reviewers.filter((reviewer) => !(reviewer.systemRole === 'author' && evaluation.type === 'feedback'))
  );

  const isProposalEvaluator = reviewers.some(
    (reviewer) =>
      (!!reviewer.userId && reviewer.userId === userId) || (!!reviewer.roleId && userRoleIds.includes(reviewer.roleId))
  );

  if (isProposalEvaluator && proposal.status !== 'draft') {
    return permissions.addPermissions(applicableProposalNotePagePermissions).operationFlags;
  }

  if (
    reviewers.some(
      (reviewer) =>
        reviewer.systemRole === 'author' &&
        isProposalAuthor({
          userId,
          proposal
        })
    )
  ) {
    return permissions.addPermissions(applicableProposalNotePagePermissions).operationFlags;
  }

  return permissions.empty;
}
