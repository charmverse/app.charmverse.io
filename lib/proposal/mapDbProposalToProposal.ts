import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalReviewer } from '@charmverse/core/prisma';
import type { Proposal } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import type { ProposalEvaluation } from '@prisma/client';

import type { PopulatedEvaluation } from 'lib/proposal/interface';

import { getOldProposalStatus } from './getOldProposalStatus';
import type { ProposalWithUsersAndRubric } from './interface';

export function mapDbProposalToProposal({
  proposal,
  permissions
}: {
  proposal: Proposal & {
    evaluations: PopulatedEvaluation[];
    rewards: { id: string }[];
    reviewers: { evaluationId: string | null }[];
    rubricAnswers: { evaluationId: string | null }[];
    draftRubricAnswers: { evaluationId: string | null }[];
  };
  permissions?: ProposalPermissionFlags;
}): ProposalWithUsersAndRubric {
  const { rewards, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const proposalWithUsers = {
    ...rest,
    permissions,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    evaluationType: currentEvaluation?.type || proposal.evaluationType,
    status: getOldProposalStatus(proposal),
    // Support old model: filter out evaluation-specific reviewers and rubric answers
    rubricAnswers: currentEvaluation?.rubricAnswers || proposal.rubricAnswers,
    draftRubricAnswers: currentEvaluation?.draftRubricAnswers || proposal.draftRubricAnswers,
    reviewers: currentEvaluation?.reviewers || proposal.reviewers,
    rewardIds: rewards.map((r) => r.id) || null
  };

  return proposalWithUsers as ProposalWithUsersAndRubric;
}

// used for mapping data for proposal blocks/tables which dont need all the evaluation data
export function mapDbProposalToProposalLite({
  proposal,
  permissions
}: {
  proposal: ProposalWithUsers & {
    evaluations: (ProposalEvaluation & { reviewers: ProposalReviewer[] })[];
    rewards: { id: string }[];
  };
  permissions?: ProposalPermissionFlags;
}): ProposalWithUsers {
  const { rewards, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const evaluationWithOldType = proposal.evaluations.find((e) => e.type === 'rubric' || e.type === 'vote');
  const proposalWithUsers = {
    ...rest,
    permissions,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    evaluationType: evaluationWithOldType?.type || proposal.evaluationType,
    status: getOldProposalStatus(proposal),
    reviewers: currentEvaluation?.reviewers || proposal.reviewers,
    rewardIds: rewards.map((r) => r.id) || null
  };

  return proposalWithUsers as ProposalWithUsers;
}
