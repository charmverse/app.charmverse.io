import type { PagePermission } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import type { PermissionComputeWithCachedData, ProposalPermissionFlags } from '@packages/core/permissions';
import { AvailableProposalPermissions, hasAccessToSpace, isProposalAuthor } from '@packages/core/permissions';
import { getCurrentEvaluation } from '@packages/core/proposals';

import type { ProposalResource } from '../../proposalPermissions/proposalResolver';
import { proposalResolver } from '../../proposalPermissions/proposalResolver';

export async function computeProposalEvaluationPermissionsForFreeSpace({
  resourceId,
  userId,
  preFetchedResource,
  preComputedSpaceRole,
  evaluationId
}: PermissionComputeWithCachedData<ProposalResource, PagePermission> & {
  evaluationId?: string;
}): Promise<ProposalPermissionFlags> {
  // Ensure these always exist
  const proposal = preFetchedResource ?? (await proposalResolver({ resourceId }));

  const { spaceRole, isReadonlySpace } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId,
    preComputedSpaceRole
  });
  const proposalPermissions = new AvailableProposalPermissions({ isReadonlySpace });

  const isDraft = proposal.status === 'draft';

  if (!isDraft) {
    proposalPermissions.addPermissions(['view']);
  }

  if (!spaceRole) {
    return proposalPermissions.operationFlags;
  } else if (spaceRole.isAdmin) {
    return proposalPermissions.full;
  }

  const isAuthor = isProposalAuthor({ proposal, userId });

  if (proposal.status === 'draft' && !evaluationId) {
    // Only add permissions when user is an author
    if (isAuthor) {
      proposalPermissions.addPermissions([
        'edit',
        'view',
        'view_private_fields',
        'delete',
        'comment',
        'make_public',
        'archive',
        'unarchive',
        'move',
        'create_vote'
      ]);
    }
  }

  if (isAuthor) {
    proposalPermissions.addPermissions(['view', 'view_private_fields', 'delete', 'make_public', 'create_vote']);
  }

  // Get current step or default to the last one
  const currentEvaluation = evaluationId
    ? proposal.evaluations.find((ev) => ev.id === evaluationId)
    : getCurrentEvaluation(proposal.evaluations);

  if (!currentEvaluation) {
    log.debug('No current evaluation found for proposal', {
      proposalId: proposal.id,
      userId,
      pageId: proposal.id
    });
    return proposalPermissions.operationFlags;
  }

  const isCurrentEvaluationReviewer = currentEvaluation?.reviewers.some(
    (reviewer) =>
      (reviewer.systemRole === 'space_member' && !!spaceRole) || (reviewer.userId && reviewer.userId === userId)
  );

  const isProposalReviewer = isCurrentEvaluationReviewer
    ? true
    : proposal.evaluations.some((evaluationStep) =>
        evaluationStep.reviewers.some(
          (reviewer) =>
            (reviewer.systemRole === 'space_member' && !!spaceRole) || (reviewer.userId && reviewer.userId === userId)
        )
      );

  // Start assigning permissions based on the step
  if (isCurrentEvaluationReviewer) {
    if (proposal.status !== 'draft') {
      proposalPermissions.addPermissions(['view', 'view_private_fields']);
    }
    proposalPermissions.addPermissions(['evaluate', 'complete_evaluation']);
  }

  for (const permission of currentEvaluation.permissions) {
    const applyPermission =
      (permission.systemRole === 'author' && isAuthor) ||
      (permission.systemRole === 'current_reviewer' && isCurrentEvaluationReviewer) ||
      (permission.systemRole === 'all_reviewers' && isProposalReviewer) ||
      permission.systemRole === 'space_member' ||
      (permission.userId && permission.userId === userId);

    if (applyPermission) {
      proposalPermissions.addPermissions([permission.operation]);
      // Edge case for granting archive and unarchive permissions along with move
      if (permission.operation === 'move') {
        proposalPermissions.addPermissions(['archive', 'unarchive']);
      }
    }
  }

  return proposalPermissions.operationFlags;
}
