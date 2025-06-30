import type { ProposalOperation } from '@charmverse/core/prisma-client';
import { ProposalEvaluationResult, prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import type { PermissionComputeWithCachedData, ProposalPermissionFlags } from '@packages/core/permissions';
import { AvailableProposalPermissions, hasAccessToSpace, isProposalAuthor } from '@packages/core/permissions';
import { getCurrentEvaluation, privateEvaluationSteps } from '@packages/core/proposals';

import type { ProposalResource } from '../proposalPermissions/proposalResolver';
import { proposalResolver } from '../proposalPermissions/proposalResolver';
import { computeSpacePermissions } from '../spacePermissions/computeSpacePermissions';

import { computeProposalNotePermissionsRaw } from './computeProposalNotePermissions';

export const baseAuthorProposalPermissions: ProposalOperation[] = [
  'view',
  'view_private_fields',
  'delete',
  'create_vote'
];
export const draftAuthorPropoalPermissions: ProposalOperation[] = [
  ...baseAuthorProposalPermissions,
  'edit',
  'edit_rewards',
  'comment',
  'move'
];

export const deleteAnySpaceProposalPermissions: ProposalOperation[] = ['delete', 'view', 'view_private_fields'];

export const baseEvaluatorPermissions: ProposalOperation[] = ['evaluate', 'complete_evaluation', 'view_notes'];

export async function computeProposalEvaluationPermissions({
  resourceId,
  userId,
  preFetchedResource,
  preComputedSpaceRole,
  preFetchedUserRoleMemberships,
  evaluationId,
  preComputedSpacePermissionFlags
}: PermissionComputeWithCachedData<ProposalResource> & {
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

  // Get current step or default to the last one
  const currentEvaluation = evaluationId
    ? proposal.evaluations.find((ev) => ev.id === evaluationId)
    : getCurrentEvaluation(proposal.evaluations);

  const isPublic = currentEvaluation?.permissions.some((permission) => permission.systemRole === 'public');

  if (!spaceRole) {
    return isPublic && proposal.status !== 'draft'
      ? proposalPermissions.addPermissions(['view']).operationFlags
      : proposalPermissions.empty;
  } else if (spaceRole?.isAdmin) {
    return proposalPermissions.full;
  } else if (isPublic) {
    proposalPermissions.addPermissions(['view']);
  }

  const isAuthor = isProposalAuthor({ proposal, userId });

  if (isAuthor) {
    proposalPermissions.addPermissions(baseAuthorProposalPermissions);
  }

  const userRoles =
    preFetchedUserRoleMemberships ??
    (await prisma.spaceRoleToRole.findMany({
      where: {
        // Only match against assigned roles for the same space as the resource
        spaceRoleId: spaceRole.id
      },
      select: {
        roleId: true
      }
    }));

  const spacePermissions =
    preComputedSpacePermissionFlags ??
    (await computeSpacePermissions({
      resourceId: proposal.spaceId,
      preComputedSpaceRole: spaceRole,
      userId,
      preFetchedUserRoleMemberships: userRoles
    }));

  function conditionallyAddArchivePermissions() {
    if (proposal.archivedByAdmin) {
      if (spaceRole?.isAdmin) {
        proposalPermissions.addPermissions(['archive', 'unarchive']);
      }
    } else {
      proposalPermissions.addPermissions(['archive', 'unarchive']);
    }
  }

  if (spacePermissions.deleteAnyProposal) {
    proposalPermissions.addPermissions(deleteAnySpaceProposalPermissions);
    conditionallyAddArchivePermissions();
  }

  if (isAuthor && proposal.status === 'draft' && !evaluationId) {
    // Author draft permissions
    proposalPermissions.addPermissions(draftAuthorPropoalPermissions);
    conditionallyAddArchivePermissions();
  }

  if (!currentEvaluation) {
    log.debug('No current evaluation found for proposal', { proposalId: proposal.id, userId, pageId: proposal.id });
    return proposalPermissions.operationFlags;
  }

  const proposalPassed =
    proposal.evaluations.every((evaluation) => evaluation.result === ProposalEvaluationResult.pass) ||
    (currentEvaluation.appealedAt && currentEvaluation.result === ProposalEvaluationResult.pass);

  // Start assigning permissions based on the step
  const applicableRoleIds = preFetchedUserRoleMemberships
    ? preFetchedUserRoleMemberships.map((r) => r.roleId)
    : await prisma.spaceRoleToRole
        .findMany({
          where: {
            spaceRoleId: spaceRole.id
          },
          select: {
            roleId: true
          }
        })
        .then((roles) => roles.map((role) => role.roleId));

  const isCurrentEvaluationReviewer = currentEvaluation?.reviewers.some(
    (reviewer) =>
      (reviewer.systemRole === 'space_member' && !!spaceRole) ||
      (reviewer.systemRole === 'author' && isAuthor) ||
      (reviewer.userId && reviewer.userId === userId) ||
      (reviewer.roleId && applicableRoleIds.includes(reviewer.roleId))
  );

  // Only provide appeal permissions if evaluation is in an appeal state
  const isCurrentEvaluationAppealReviewer = currentEvaluation?.appealReviewers.some(
    (reviewer) =>
      (reviewer.userId && reviewer.userId === userId) ||
      (reviewer.roleId && applicableRoleIds.includes(reviewer.roleId))
  );
  const isCurrentProposalAppealReviewer =
    isCurrentEvaluationAppealReviewer ||
    proposal.evaluations.some((evaluation) => {
      return evaluation.appealReviewers.some(
        (reviewer) =>
          (reviewer.userId && reviewer.userId === userId) ||
          (reviewer.roleId && applicableRoleIds.includes(reviewer.roleId))
      );
    });
  const isAppealActive = !!currentEvaluation.appealedAt && !currentEvaluation.result;

  const isProposalReviewer =
    !!isCurrentEvaluationReviewer ||
    proposal.evaluations.some((evaluationStep) =>
      evaluationStep.reviewers.some(
        (reviewer) =>
          (reviewer.systemRole === 'space_member' && !!spaceRole) ||
          (reviewer.userId && reviewer.userId === userId) ||
          (reviewer.roleId && applicableRoleIds.includes(reviewer.roleId))
      )
    );

  // Provide retro-compatibility so reviewers can always move the proposal forward if this permission was not set
  const isCurrentEvaluationApprover =
    (isCurrentEvaluationReviewer && !currentEvaluation.evaluationApprovers.length) ||
    currentEvaluation.evaluationApprovers.some(
      (approver) =>
        (approver.roleId && applicableRoleIds.includes(approver.roleId)) ||
        (approver.userId && approver.userId === userId)
    );

  if (isCurrentEvaluationReviewer) {
    proposalPermissions.addPermissions(['evaluate']);
  }
  if (isCurrentEvaluationApprover) {
    proposalPermissions.addPermissions(['complete_evaluation']);
  }

  if (isCurrentEvaluationAppealReviewer) {
    if (isAppealActive) {
      proposalPermissions.addPermissions(['evaluate_appeal']);
    }
  }

  const notePermissions = computeProposalNotePermissionsRaw({
    proposal,
    userRoleIds: userRoles.map((r) => r.roleId),
    userId,
    isReadonlySpace
  });

  if (
    (notePermissions.read || isProposalReviewer || isCurrentProposalAppealReviewer || isCurrentEvaluationApprover) &&
    proposal.status !== 'draft'
  ) {
    proposalPermissions.addPermissions(['view_notes', 'view', 'view_private_fields']);
  }

  for (const permission of currentEvaluation.permissions) {
    const applyPermission =
      (permission.systemRole === 'author' && isAuthor) ||
      // Inherit permissions from reviewers
      (permission.systemRole === 'current_reviewer' &&
        (isCurrentEvaluationReviewer || isCurrentEvaluationAppealReviewer)) ||
      (permission.systemRole === 'all_reviewers' && (isProposalReviewer || isCurrentProposalAppealReviewer)) ||
      permission.systemRole === 'space_member' ||
      (permission.userId && permission.userId === userId) ||
      (permission.roleId && applicableRoleIds.includes(permission.roleId));

    // We want to prevent authors editing a proposal that has passed. At this point, they should only be able to edit the rewards
    if (applyPermission && permission.operation === 'edit' && isAuthor) {
      if (proposalPassed) {
        proposalPermissions.addPermissions(['edit_rewards']);
      } else {
        proposalPermissions.addPermissions(['edit', 'edit_rewards']);
      }
    } else if (applyPermission) {
      if (permission.operation === 'move') {
        const isConcealableStep =
          proposal.workflow?.privateEvaluations && privateEvaluationSteps.includes(currentEvaluation.type);

        // Deny move permission if the step is concealable and the user is not a reviewer
        if (!isConcealableStep || isCurrentEvaluationReviewer) {
          proposalPermissions.addPermissions(['move']);
          // Edge case for granting archive and unarchive permissions along with move
          conditionallyAddArchivePermissions();
        }
      } else {
        proposalPermissions.addPermissions([permission.operation]);
      }
    }
  }

  return proposalPermissions.operationFlags;
}
